import React from 'react';
import '../../styles/admin/adminPage.scss';

const AdminRestaurantProfilePage = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Perfil do Restaurante</h1>
        <p className="admin-page-subtitle">
          Configure as informações do restaurante, horários de funcionamento, dados de contato e
          configurações gerais.
        </p>
      </div>

      <div className="admin-page-content">
        <div className="admin-placeholder-card">
          <div className="admin-placeholder-icon">🏪</div>
          <h3>Página em Desenvolvimento</h3>
          <p>
            A funcionalidade de configuração do perfil do restaurante está sendo desenvolvida e
            estará disponível em breve.
          </p>
          <div className="admin-placeholder-features">
            <h4>Funcionalidades Planejadas:</h4>
            <ul>
              <li>✅ Editar informações básicas</li>
              <li>✅ Configurar horários de funcionamento</li>
              <li>✅ Gerenciar dados de contato</li>
              <li>✅ Upload de logo e imagens</li>
              <li>✅ Configurações de delivery</li>
              <li>✅ Métodos de pagamento aceitos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurantProfilePage;
