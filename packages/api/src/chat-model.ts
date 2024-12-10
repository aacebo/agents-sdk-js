import OpenAI, { ClientOptions } from 'openai';

import { ObjectSchema } from './schema';
import { Function } from './function';

interface ChatModelSendParams {
  readonly input: OpenAI.Chat.Completions.ChatCompletionMessageParam;
  readonly body: OpenAI.Chat.Completions.ChatCompletionCreateParams;
  readonly onChunk?: Function<OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta, void>;
  readonly functions?: Record<string, {
    readonly description: string;
    readonly parameters?: ObjectSchema;
    readonly callback: Function;
  }>;
}

type ToolCallParams = Omit<ChatModelSendParams, 'input'> & {
  readonly input: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta;
};

export class ChatModel {
  private readonly _client: OpenAI;

  constructor(readonly options: ClientOptions) {
    this._client = new OpenAI(options);
  }

  async send(params: ChatModelSendParams): Promise<OpenAI.Chat.ChatCompletionMessage> {
    params.body.messages.push(params.input);

    if (params.input.role === 'assistant' && params.input.tool_calls?.length) {
      for (const call of params.input.tool_calls) {
        const fn = (params.functions || { })[call.function.name];

        if (!fn) {
          throw new Error(`function ${call.function.name} not found`);
        }

        const output = await fn.callback(JSON.parse(call.function.arguments));

        params.body.messages.push({
          role: 'tool',
          content: JSON.stringify(output),
          tool_call_id: call.id
        });
      }
    }

    const stream = await this._client.chat.completions.create({
      ...params.body,
      stream: true,
      tools: Object.entries(params.functions || { }).map(([name, value]) => ({
        type: 'function',
        function: {
          name,
          description: value.description,
          parameters: value.parameters || { }
        }
      }))
    });

    const message: OpenAI.Chat.ChatCompletionMessage = {
      role: 'assistant',
      content: '',
      refusal: null
    };

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;

      if (delta.tool_calls && delta.tool_calls.length > 0) {
        return this._onToolCall({ ...params, input: delta });
      }

      if (delta.content) {
        if (message.content) {
          message.content += delta.content;
        } else {
          message.content = delta.content;
        }
      }

      if (params.onChunk) {
        await params.onChunk(delta);
      }
    }

    return message;
  }

  private _onToolCall(params: ToolCallParams) {
    const calls: OpenAI.ChatCompletionMessageToolCall[] = [];

    for (const call of params.input.tool_calls || []) {
      if ('index' in call) {
        if (call.index === calls.length) {
          calls.push({
            id: '',
            type: 'function',
            function: {
              name: '',
              arguments: '{}'
            }
          });
        }

        if (call.id) {
          calls[call.index].id = call.id;
        }

        if (call.function?.name) {
          calls[call.index].function.name = call.function.name;
        }

        if (call.function?.arguments) {
          calls[call.index].function.arguments = call.function.arguments;
        }
      } else {
        calls.push(call);
      }
    }

    return this.send({
      ...params,
      input: {
        role: params.input.role || 'user',
        content: params.input.content,
        tool_calls: calls,
        refusal: params.input.refusal
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam
    });
  }
}
