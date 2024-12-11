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

        let output = await fn.callback(JSON.parse(call.function.arguments));

        if (typeof output !== 'string') {
          output = JSON.stringify(output);
        }

        params.body.messages.push({
          role: 'tool',
          content: output,
          tool_call_id: call.id
        });
      }
    }

    const tools = Object.entries(params.functions || { }).map(([name, value]) => ({
      type: 'function',
      function: {
        name,
        description: value.description,
        parameters: value.parameters || { },
        strict: true
      }
    } as OpenAI.Chat.Completions.ChatCompletionTool));

    const stream = await this._client.chat.completions.create({
      ...params.body,
      stream: true,
      tools: tools.length > 0 ? tools : undefined
    } as OpenAI.ChatCompletionCreateParamsStreaming);

    const message: OpenAI.Chat.ChatCompletionMessage = {
      role: 'assistant',
      content: '',
      refusal: null
    };

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;

      if (delta.tool_calls) {
        if (!message.tool_calls) {
          message.tool_calls = [];
        }

        for (const call of delta.tool_calls) {
          if ('index' in call) {
            if (call.index === message.tool_calls.length) {
              message.tool_calls.push({
                id: '',
                type: 'function',
                function: {
                  name: '',
                  arguments: ''
                }
              });
            }

            if (call.id) {
              message.tool_calls[call.index].id += call.id;
            }

            if (call.function?.name) {
              message.tool_calls[call.index].function.name += call.function.name;
            }

            if (call.function?.arguments) {
              message.tool_calls[call.index].function.arguments += call.function.arguments;
            }
          } else {
            message.tool_calls.push(call);
          }
        }
      }

      if (delta.content) {
        if (message.content) {
          message.content += delta.content;
        } else {
          message.content = delta.content;
        }

        if (params.onChunk) {
          await params.onChunk(delta);
        }
      }
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      return this.send({ ...params, input: message });
    }

    return message;
  }
}
