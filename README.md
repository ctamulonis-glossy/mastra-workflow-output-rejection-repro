# `WorkflowRunOutput.result`: unhandled rejection after a failed run

```bash
npm install
node repro.ts   # BUG: 1 unhandled rejection(s), exits 1
```

`@mastra/core` 1.85.0. A run fails before its result is read (`rejectResults`), a consumer then reads `result` and
handles the rejection, and the run's final result arrives (`updateResults`). `DelayedPromise.resolve()` chains
`this._promise.then(() => value)` onto the already-rejected promise; that new promise rejects unhandled, which ends a
Node process. In an app this happened on durable agent runs that failed (an output processor's `error` chunk, a
provider error).
