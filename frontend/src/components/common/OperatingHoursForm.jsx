import React from 'react';
import PropTypes from 'prop-types';

const OperatingHoursForm = ({
  operatingHours = {},
  onChange,
  disabled = false,
  _errors = {},
  _touched = {},
  _locationIndex = 0,
}) => {
  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
    { key: 'holidays', label: 'Feriados' },
  ];

  const handleTimeChange = (day, timeType, value) => {
    if (onChange) {
      onChange(day, timeType, value);
    }
  };

  const handleClosedToggle = (day) => {
    const dayHours = operatingHours[day] || {};
    const newIsClosed = !dayHours.is_closed;

    if (onChange) {
      onChange(day, 'is_closed', newIsClosed);
      if (newIsClosed) {
        onChange(day, 'open_time', '');
        onChange(day, 'close_time', '');
      }
    }
  };

  return (
    <div className="operating-hours-form" lang="en-GB">
      <style>{`
        .day-hours-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }

        .day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .day-label {
          font-weight: 600;
          font-size: 14px;
          color: #495057;
        }

        .closed-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6c757d;
          cursor: pointer;
        }

        .time-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .time-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .time-input-container {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .time-input {
          padding: 6px 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 13px;
          width: 100%;
          font-family: monospace;
        }

        /* Force 24-hour format */
        .time-input::-webkit-datetime-edit-ampm-field {
          display: none;
        }

        .time-input::-webkit-datetime-edit-hour-field {
          color: #495057;
        }

        .time-label {
          font-size: 11px;
          font-weight: 500;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .time-input:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        /* Tablet and Desktop - inline layout */
        @media (min-width: 768px) {
          .day-hours-row {
            flex-direction: row;
            align-items: center;
            gap: 15px;
            padding: 8px;
            margin-bottom: 10px;
          }

          .day-header {
            margin-bottom: 0;
            justify-content: flex-start;
            gap: 12px;
            min-width: 200px;
          }

          .day-label {
            min-width: 120px;
          }

          .closed-toggle {
            min-width: 80px;
          }

          .time-fields {
            flex-direction: row;
            gap: 15px;
            align-items: center;
          }

          .time-field {
            flex-direction: row;
            align-items: center;
            gap: 5px;
            min-width: 140px;
          }

          .time-label {
            font-size: 12px;
            min-width: 60px;
          }

          .time-input {
            width: 90px;
          }
        }
      `}</style>
      {days.map(({ key, label }) => {
        const dayHours = operatingHours[key] || {};
        const isClosed = dayHours.is_closed || false;
        const openTime = dayHours.open_time || '';
        const closeTime = dayHours.close_time || '';

        return (
          <div key={key} className="day-hours-row">
            <div className="day-header">
              <div className="day-label">{label}</div>
              <label className="closed-toggle">
                <input
                  type="checkbox"
                  checked={isClosed}
                  onChange={() => handleClosedToggle(key)}
                  disabled={disabled}
                />
                <span>Fechado</span>
              </label>
            </div>

            <div className="time-fields">
              <div className="time-field">
                <label htmlFor={`${key}-open`} className="time-label">
                  Abertura
                </label>
                <div className="time-input-container">
                  <input
                    id={`${key}-open`}
                    type="time"
                    step="60"
                    value={openTime}
                    onChange={(e) => handleTimeChange(key, 'open_time', e.target.value)}
                    disabled={disabled || isClosed}
                    className="time-input"
                    lang="en-GB"
                    style={{
                      opacity: isClosed ? 0.6 : 1,
                      backgroundColor: disabled || isClosed ? '#f8f9fa' : '#fff',
                      color: disabled || isClosed ? '#6c757d' : '#495057',
                    }}
                  />
                </div>
              </div>

              <div className="time-field">
                <label htmlFor={`${key}-close`} className="time-label">
                  Fechamento
                </label>
                <div className="time-input-container">
                  <input
                    id={`${key}-close`}
                    type="time"
                    step="60"
                    value={closeTime}
                    onChange={(e) => handleTimeChange(key, 'close_time', e.target.value)}
                    disabled={disabled || isClosed}
                    className="time-input"
                    lang="en-GB"
                    style={{
                      opacity: isClosed ? 0.6 : 1,
                      backgroundColor: disabled || isClosed ? '#f8f9fa' : '#fff',
                      color: disabled || isClosed ? '#6c757d' : '#495057',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

OperatingHoursForm.propTypes = {
  operatingHours: PropTypes.object,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  _errors: PropTypes.object,
  _touched: PropTypes.object,
  _locationIndex: PropTypes.number,
};

export default OperatingHoursForm;
