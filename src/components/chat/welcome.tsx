import { AlbaMark, Icon, type IconName } from './icon';

const suggestions: { icon: IconName; label: string; prompt: string }[] = [
  {
    icon: 'bulb',
    label: 'Entender lo que me pasa',
    prompt:
      'Quiero entender si lo que estoy viviendo podría ser acoso. Ayúdame a aclararlo paso a paso.',
  },
  {
    icon: 'write',
    label: 'Hablar de una situación',
    prompt:
      'Me gustaría hablar de una situación que me preocupa, pero no sé por dónde empezar.',
  },
  {
    icon: 'spark',
    label: 'Buscar cómo pedir ayuda',
    prompt:
      'Quiero saber cómo pedir ayuda ante una situación de acoso. Ayúdame a pensar en un primer paso.',
  },
];

export function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <section className="welcome">
      <div className="hero-symbol" aria-hidden="true">
        <AlbaMark />
      </div>
      <h1>
        No tienes que afrontarlo
        <br />
        en <em>soledad.</em>
      </h1>
      <p>
        Un espacio para hablar del acoso y encontrar orientación, sin juicios.
        <br />
        Comparte lo que te preocupa, a tu ritmo.
      </p>
      <div className="suggestions">
        {suggestions.map((s) => (
          <button key={s.icon} onClick={() => onPrompt(s.prompt)}>
            <Icon name={s.icon} />
            <span>{s.label}</span>
            <span className="suggestion-arrow" aria-hidden="true">
              ↗
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
