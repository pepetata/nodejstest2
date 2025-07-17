import React from 'react';
import '../../../styles/admin/adminPage.scss';

const AdminUsersPage = () => {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Gerenciar Usuários</h1>
        <p className="admin-page-subtitle">
          Visualize e gerencie usuários do sistema. Controle permissões, status de contas e
          informações dos usuários.
        </p>
      </div>

      <div className="admin-page-content">
        <div className="admin-placeholder-card">
          <div className="admin-placeholder-icon">👥</div>
          <h3>Página em Desenvolvimento</h3>
          <p>
            A funcionalidade de gerenciamento de usuários está sendo desenvolvida e estará
            disponível em breve.
          </p>
          <div className="admin-placeholder-features">
            <h4>Funcionalidades Planejadas:</h4>
            <ul>
              <li>✅ Visualizar lista de usuários</li>
              <li>✅ Editar informações dos usuários</li>
              <li>✅ Gerenciar permissões e roles</li>
              <li>✅ Bloquear/desbloquear contas</li>
              <li>✅ Histórico de atividades</li>
              <li>✅ Relatórios de usuários</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
