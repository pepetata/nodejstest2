import React from 'react';
import '../../styles/admin/adminPage.scss';

const AdminMenuPage = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Gerenciar Menu</h1>
        <p className="admin-page-subtitle">
          Gerencie o cardápio do seu restaurante. Adicione, edite ou remova itens, configure preços
          e disponibilidade.
        </p>
      </div>

      <div className="admin-page-content">
        <div className="admin-placeholder-card">
          <div className="admin-placeholder-icon">🍽️</div>
          <h3>Página em Desenvolvimento</h3>
          <p>
            A funcionalidade de gerenciamento de menu está sendo desenvolvida e estará disponível em
            breve.
          </p>
          <div className="admin-placeholder-features">
            <h4>Funcionalidades Planejadas:</h4>
            <ul>
              <li>✅ Adicionar novos itens ao menu</li>
              <li>✅ Editar informações de pratos existentes</li>
              <li>✅ Configurar preços e promoções</li>
              <li>✅ Gerenciar categorias de alimentos</li>
              <li>✅ Upload de imagens dos pratos</li>
              <li>✅ Controle de disponibilidade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMenuPage;
