-- Adiciona a coluna de idioma preferido ao perfil do usuário
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.language IS 'Idioma preferido do usuário (ex: pt-BR, en-GB, es-AR)';