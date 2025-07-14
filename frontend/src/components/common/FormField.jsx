import React from 'react';
import PropTypes from 'prop-types';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  placeholder = '',
  helper = '',
  maxLength,
  min,
  max,
  step,
  options = [],
  children,
}) => {
  const hasError = touched && error;

  return (
    <div className="form-field">
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      {children ? (
        children
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`field-input ${hasError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          className={`field-input ${hasError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        />
      )}

      {helper && !hasError && <p className="field-helper">{helper}</p>}

      {hasError && <p className="field-error">{error}</p>}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  helper: PropTypes.string,
  maxLength: PropTypes.number,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  children: PropTypes.node,
};

export default FormField;
