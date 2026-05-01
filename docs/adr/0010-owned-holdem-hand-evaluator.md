# Owned Hold'em hand evaluator

The API will implement its own No Limit Texas Hold'em hand evaluator instead of depending on a runtime poker evaluator package. The evaluator will be a pure server-owned module with no NestJS or database dependency; existing evaluators may be used as development references, but showdown correctness will be protected by first-party contract tests for ranking, kickers, ties, wheel straights, flushes, full houses, and split pots.
