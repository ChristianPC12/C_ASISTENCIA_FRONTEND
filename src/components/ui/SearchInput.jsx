export default function SearchInput({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
  disabled = false,
  size = 'sm'
}) {
  const clases = ['iasd-search-input', className].filter(Boolean).join(' ');

  return (
    <label htmlFor={id} className={clases}>
      <i className="bi bi-search" aria-hidden="true"></i>
      <input
        id={id}
        type="search"
        className={`form-control form-control-${size}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoComplete="off"
        disabled={disabled}
      />
    </label>
  );
}
