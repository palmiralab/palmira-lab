import { services } from '@/lib/content';

export function Services() {
  return (
    <section id="services">
      <h2>Услуги</h2>
      <div>
        {services.map((service) => (
          <article key={service.index}>
            <span>{service.index}</span>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
