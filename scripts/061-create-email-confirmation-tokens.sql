-- Criar tabela para tokens de confirmação de email
CREATE TABLE IF NOT EXISTS email_confirmation_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_user_id ON email_confirmation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_token ON email_confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_email ON email_confirmation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_expires_at ON email_confirmation_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_used ON email_confirmation_tokens(used);

-- Criar função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM email_confirmation_tokens 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_confirmation_tokens_updated_at 
    BEFORE UPDATE ON email_confirmation_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar RLS (Row Level Security)
ALTER TABLE email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de tokens
CREATE POLICY "Users can insert their own confirmation tokens" ON email_confirmation_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir leitura de tokens do próprio usuário
CREATE POLICY "Users can read their own confirmation tokens" ON email_confirmation_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir atualização de tokens do próprio usuário
CREATE POLICY "Users can update their own confirmation tokens" ON email_confirmation_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que o sistema confirme tokens (sem autenticação)
CREATE POLICY "System can confirm tokens" ON email_confirmation_tokens
    FOR UPDATE USING (true);

-- Comentários na tabela
COMMENT ON TABLE email_confirmation_tokens IS 'Tabela para armazenar tokens de confirmação de email enviados via Resend';
COMMENT ON COLUMN email_confirmation_tokens.user_id IS 'ID do usuário que solicitou a confirmação';
COMMENT ON COLUMN email_confirmation_tokens.email IS 'Email do usuário';
COMMENT ON COLUMN email_confirmation_tokens.token IS 'Token único para confirmação';
COMMENT ON COLUMN email_confirmation_tokens.expires_at IS 'Data de expiração do token';
COMMENT ON COLUMN email_confirmation_tokens.used IS 'Indica se o token já foi usado'; 