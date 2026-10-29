import {
  InferenceInput,
  InferenceOutput,
  InferenceRunner,
  ModelMessageItem,
  SemanticEvent,
  UserMessageItem,
} from "@mozaik-ai/core";

export interface MockRunnerConfig {
  responseGenerator?: (prompt: string) => string;
}

/**
 * Deterministic, offline mock inference runner for Mozaik agents.
 * Enables 100% reproducible unit tests and zero-token-cost local execution.
 */
export class MockInferenceRunner implements InferenceRunner {
  constructor(private readonly config: MockRunnerConfig = {}) {}

  async run(input: InferenceInput): Promise<InferenceOutput> {
    const lastUserMessage = [...input.context.getItems()]
      .reverse()
      .find((item) => item instanceof UserMessageItem);

    const userText = lastUserMessage?.content?.text ?? "";
    const responseText = this.config.responseGenerator
      ? this.config.responseGenerator(userText)
      : `[Mock Verified Response] Evaluated: "${userText}"`;

    return {
      items: [ModelMessageItem.rehydrate({ text: responseText })],
      tokenUsage: undefined,
      rowResponse: { mock: true, model: input.model },
    };
  }

  async *stream(input: InferenceInput): AsyncGenerator<SemanticEvent> {
    const result = await this.run(input);
    yield SemanticEvent.create("inference.output", input.model, result);
  }
}
