import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/ErrorBoundary.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    // eslint-disable-next-line no-console
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log the error to an error reporting service here
    // For example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    // Clear the error state and reload the page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear the error state and navigate to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-boundary-content">
              <h1 className="error-boundary-title">Oops! Algo deu errado</h1>
              <p className="error-boundary-message">
                Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para
                resolver o problema.
              </p>

              <div className="error-boundary-actions">
                <button onClick={this.handleReload} className="error-boundary-button primary">
                  Tentar Novamente
                </button>
                <button onClick={this.handleGoHome} className="error-boundary-button secondary">
                  Voltar ao Início
                </button>
              </div>

              {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && (
                <details className="error-boundary-details">
                  <summary>Detalhes do Erro (Desenvolvimento)</summary>
                  <div className="error-boundary-error-details">
                    <h3>Error:</h3>
                    <pre>{this.state.error && this.state.error.toString()}</pre>

                    <h3>Stack Trace:</h3>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
