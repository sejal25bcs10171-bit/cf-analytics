export default function Suggestions({ data, weakTag }) {
  if (!data?.length) return null;

  return (
    <div className="card">
      <h2>
        💡 Practice Suggestions
        <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.88rem' }}>
          &nbsp;— weakest tag: <b style={{ color: 'var(--weak)' }}>{weakTag}</b>
        </span>
      </h2>
      <ul className="suggestions">
        {data.map((p, i) => (
          <li key={i}>
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              {p.name}
            </a>
            <span className="rating-chip">⭐ {p.rating}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

