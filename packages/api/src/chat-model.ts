import OpenAI, { ClientOptions } from 'openai';
import { Stream } from 'openai/streaming';

import { MessageEvent } from '@agents.sdk/core';

import { ObjectSchema } from './schema';
import { Function } from './function';

export interface FunctionDefinition {
  readonly description: string;
  readonly parameters?: ObjectSchema;
  readonly callback: Function<MessageEvent, MessageEvent>;
}

interface ChatModelSendParams {
  readonly id: string;
  readonly input: OpenAI.Chat.Completions.ChatCompletionMessageParam;
  readonly body: OpenAI.Chat.Completions.ChatCompletionCreateParams;
  readonly onChunk?: Function<OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta, void>;
  readonly functions?: Record<string, FunctionDefinition>;
}

interface ChatModelSendResponse {
  readonly $meta: Record<string, any>;
  readonly message: OpenAI.Chat.ChatCompletionMessage;
}

export class ChatModel {
  private readonly _client: OpenAI;

  constructor(readonly options: ClientOptions) {
    this._client = new OpenAI(options);
  }

  async send(params: ChatModelSendParams): Promise<ChatModelSendResponse> {
    let $meta: Record<string, any> = { };
    params.body.messages.push(params.input);

    if (params.input.role === 'assistant' && params.input.tool_calls?.length) {
      for (const call of params.input.tool_calls) {
        const fn = (params.functions || { })[call.function.name];

        if (!fn) {
          throw new Error(`function ${call.function.name} not found`);
        }

        const start = new Date();
        const res = await fn.callback({
          ...JSON.parse(call.function.arguments),
          id: params.id
        });

        const elapse = new Date().getTime() - start.getTime();
        $meta[call.function.name] = {
          $elapse: elapse,
          ...res.$meta
        };

        params.body.messages.push({
          role: 'tool',
          content: res.content,
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

    const res = await this._client.chat.completions.create({
      ...params.body,
      tools: tools.length > 0 ? tools : undefined
    });

    let message: OpenAI.Chat.ChatCompletionMessage = {
      role: 'assistant',
      content: '',
      refusal: null
    };

    if (!(res instanceof Stream)) {
      message = res.choices[0].message;
    } else {
      for await (const chunk of res) {
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
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      const res = await this.send({ ...params, input: message });

      return {
        $meta: { ...$meta, ...res.$meta },
        message: res.message
      };
    }

    return { $meta, message };
  }
}
