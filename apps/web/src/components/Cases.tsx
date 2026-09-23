import { cases } from '@/lib/content';

export function Cases() {
  return (
    <section id="cases">
      <h2>Кейсы</h2>
      <div>
        {cases.map((item) => (
          <article key={item.tag}>
            <span>{item.tag}</span>
            <div>
              <h4>Проблема</h4>
              <p>{item.problem}</p>
            </div>
            <div>
              <h4>Решение</h4>
              <p>{item.solution}</p>
            </div>
            <div>
              <h4>Результат</h4>
              <p>{item.result}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
