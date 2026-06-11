/**
 * A generic worker wrapper to run tasks in a background thread.
 */
export async function runInWorker(taskFn, data) {
  const blob = new Blob([`
    self.onmessage = async (e) => {
      const { taskFnStr, data } = e.data;
      try {
        const fn = new Function('return ' + taskFnStr)();
        const result = await fn(data);
        self.postMessage({ result });
      } catch (error) {
        self.postMessage({ error: error.message });
      }
    };
  `], { type: 'application/javascript' });
  
  const worker = new Worker(URL.createObjectURL(blob));
  
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };
    worker.postMessage({ taskFnStr: taskFn.toString(), data });
    
    // Safety timeout
    setTimeout(() => {
      worker.terminate();
      reject(new Error('任务执行超时 (可能是正则表达式过于复杂)'));
    }, 5000);
  });
}
