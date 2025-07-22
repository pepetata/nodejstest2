import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import '../styles/pages/comingSoon.scss';

const ComingSoon = () => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          {/* Header */}
          <div className="coming-soon-header">
            <div className="coming-soon-icon">
              <FaClock />
            </div>
            <h1 className="coming-soon-title">Em Breve</h1>
            <p className="coming-soon-subtitle">Estamos preparando algo incrível para você!</p>
          </div>

          {/* Message */}
          <div className="coming-soon-message">
            <p>
              Nossa plataforma para garçons e funcionários está sendo desenvolvida com muito
              carinho. Em breve você terá acesso a todas as funcionalidades necessárias para
              oferecer o melhor atendimento.
            </p>

            <div className="coming-soon-features">
              <h3>O que está por vir:</h3>
              <ul>
                <li>Interface intuitiva para pedidos</li>
                <li>Comunicação em tempo real com a cozinha</li>
                <li>Gestão de mesas e clientes</li>
                <li>Relatórios de desempenho</li>
                <li>E muito mais!</li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="coming-soon-contact">
            <div className="contact-info">
              <FaEnvelope />
              <p>
                Dúvidas? Entre em contato conosco:
                <a href="mailto:suporte@alacarte.app"> suporte@alacarte.app</a>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="coming-soon-actions">
            <Link to={`/login`} className="btn btn-primary">
              <FaArrowLeft />
              Voltar ao Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="coming-soon-footer">
          <p>&copy; 2025 À La Carte. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
