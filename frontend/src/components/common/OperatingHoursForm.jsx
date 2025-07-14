import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/admin/operatingHoursForm.scss';

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
              {!isClosed && (
                <>
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
                        disabled={disabled}
                        className="time-input"
                        lang="en-GB"
                        style={{
                          backgroundColor: disabled ? '#f8f9fa' : '#fff',
                          color: disabled ? '#6c757d' : '#495057',
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
                        disabled={disabled}
                        className="time-input"
                        lang="en-GB"
                        style={{
                          backgroundColor: disabled ? '#f8f9fa' : '#fff',
                          color: disabled ? '#6c757d' : '#495057',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
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
