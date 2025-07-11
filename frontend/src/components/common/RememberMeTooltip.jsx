import React from 'react';
import '../../styles/RememberMeTooltip.scss';

class RememberMeTooltip extends React.Component {
  state = { show: false };

  showTooltip = () => this.setState({ show: true });
  hideTooltip = () => this.setState({ show: false });

  render() {
    return (
      <span
        className="remember-me-tooltip-wrapper"
        onMouseEnter={this.showTooltip}
        onMouseLeave={this.hideTooltip}
        tabIndex={0}
        onFocus={this.showTooltip}
        onBlur={this.hideTooltip}
      >
        <svg
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          style={{ cursor: 'pointer' }}
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12zm.93-9.412-1 4.5a.5.5 0 0 0 .49.612h.02a.5.5 0 0 0 .49-.388l.5-2.5a.5.5 0 0 0-.98-.224l-.5 2.5a1.5 1.5 0 1 1 2.98 0 .5.5 0 0 0 .98 0 2.5 2.5 0 1 0-4.98 0 .5.5 0 0 0 .98 0 1.5 1.5 0 1 1 2.98 0 .5.5 0 0 0 .98 0 2.5 2.5 0 1 0-4.98 0 .5.5 0 0 0 .98 0 1.5 1.5 0 1 1 2.98 0 .5.5 0 0 0 .98 0 2.5 2.5 0 1 0-4.98 0 .5.5 0 0 0 .98 0z" />
        </svg>
        <span
          className="remember-me-tooltip"
          style={{ display: this.state.show ? 'block' : 'none' }}
        >
          Se marcado, você permanecerá conectado mesmo após fechar o navegador. Não use em
          computadores públicos.
        </span>
      </span>
    );
  }
}

export default RememberMeTooltip;
