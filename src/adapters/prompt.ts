import readline = require('readline');

export async function ask(question) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  let promise = new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });

  return await promise;
}
