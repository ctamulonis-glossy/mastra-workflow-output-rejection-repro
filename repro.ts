// WorkflowRunOutput's `result` is a DelayedPromise. When a run fails, the stream path calls rejectResults(err)
// (run-registry, `catch (err) { self.streamOutput?.rejectResults(err) }`), and the start() path then calls
// updateResults(result) on the same output (`executionResultPromise.then((result) => this.streamOutput?.updateResults(result))`).
// When the result is read after the rejection, the getter builds an already-rejected promise with no resolver, so the next
// DelayedPromise.resolve() takes `this._promise = this._promise.then(() => value)`: that new promise rejects with the
// original error and nothing handles it, so Node ends the process (unhandledRejection).
// Exits 1 while the bug exists.
import { WorkflowRunOutput } from '@mastra/core/stream';

let unhandled = 0;
process.on('unhandledRejection', (reason) => {
  unhandled++;
  console.log('unhandled rejection:', String(reason));
});

const output = new WorkflowRunOutput({ runId: 'run-1', workflowId: 'wf', stream: new ReadableStream({ start: (c) => c.close() }) });
const error = new Error('step failed');
// The run fails before anyone has read its result.
output.rejectResults(error);
// A consumer then reads the result and handles its failure.
output.result.catch((reason: unknown) => console.log('consumer saw:', String(reason)));
// The run's final result arrives afterwards, as start() reports it.
output.updateResults({ status: 'failed', error } as never);

await new Promise((resolve) => setTimeout(resolve, 200));
console.log(unhandled ? `BUG: ${unhandled} unhandled rejection(s)` : 'OK: no unhandled rejection');
process.exit(unhandled ? 1 : 0);
