import React from 'react';
import { useSelector } from 'react-redux';
import '../../../styles/admin/adminPage.scss';

const AdminUserProfilePage = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Meu Perfil</h1>
        <p className="admin-page-subtitle">
          Atualize suas informações pessoais, altere sua senha e configure suas preferências.
        </p>
      </div>

      <div className="admin-page-content">
        <div className="admin-placeholder-card">
          <div className="admin-placeholder-icon">👤</div>
          <h3>Página em Desenvolvimento</h3>
          <p>
            A funcionalidade de gerenciamento do perfil do usuário está sendo desenvolvida e estará
            disponível em breve.
          </p>

          {user && (
            <div className="admin-current-user-info">
              <h4>Informações Atuais:</h4>
              <div className="admin-user-details">
                <p>
                  <strong>Nome:</strong> {user.name || 'Não informado'}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Função:</strong> {user.role || 'Não informado'}
                </p>
                <p>
                  <strong>Status:</strong> {user.status || 'Ativo'}
                </p>
              </div>
            </div>
          )}

          <div className="admin-placeholder-features">
            <h4>Funcionalidades Planejadas:</h4>
            <ul>
              <li>✅ Editar informações pessoais</li>
              <li>✅ Alterar senha</li>
              <li>✅ Configurar notificações</li>
              <li>✅ Histórico de atividades</li>
              <li>✅ Configurações de privacidade</li>
              <li>✅ Upload de foto de perfil</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfilePage;
