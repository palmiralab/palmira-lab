import { deepSeekProvider } from '../src/lib/ai-provider/deepseek';

async function main() {
  const message = process.argv.slice(2).join(' ') ||
    'Хочу телеграм-бота, который принимает заявки от клиентов автосервиса и записывает их в таблицу.';

  const result = await deepSeekProvider.classifyAndDraft({
    messages: [{ role: 'user', content: message }],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
