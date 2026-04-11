// Limpar formatação do CNPJ
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

// Validar CNPJ (algoritmo oficial)
export function validateCnpj(cnpj: string): boolean {
  const c = cleanCnpj(cnpj)
  if (c.length !== 14) return false
  if (/^(\d)\1+$/.test(c)) return false

  const calc = (str: string, x: number) => {
    let sum = 0
    let pos = x - 7
    for (let i = x; i >= 1; i--) {
      sum += parseInt(str[x - i]) * pos--
      if (pos < 2) pos = 9
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11)
  }

  return (
    calc(c, 12) === parseInt(c[12]) &&
    calc(c, 13) === parseInt(c[13])
  )
}

// Buscar dados na API pública da Receita Federal
export async function fetchCnpjData(cnpj: string): Promise<{
  razaoSocial: string | null
  nomeFantasia: string | null
  setor: string | null
  email: string | null
  socioAdministrador: string | null
  error: string | null
}> {
  const clean = cleanCnpj(cnpj)
  if (!validateCnpj(clean)) {
    return {
      razaoSocial: null, nomeFantasia: null, setor: null,
      email: null, socioAdministrador: null,
      error: 'CNPJ inválido',
    }
  }

  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${clean}`)
    if (!res.ok) {
      if (res.status === 404) return {
        razaoSocial: null, nomeFantasia: null, setor: null,
        email: null, socioAdministrador: null,
        error: 'CNPJ não encontrado na Receita Federal',
      }
      if (res.status === 429) return {
        razaoSocial: null, nomeFantasia: null, setor: null,
        email: null, socioAdministrador: null,
        error: 'Muitas consultas. Aguarde alguns segundos.',
      }
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json() as {
      razao_social?: string
      cnae_fiscal_descricao?: string
      estabelecimento?: { nome_fantasia?: string; email?: string }
      socios?: Array<{ nome?: string; qualificacao_socio?: { descricao?: string } }>
    }

    const socioAdmin = data.socios?.find((s) =>
      s.qualificacao_socio?.descricao?.toLowerCase().includes('administrador')
    ) ?? data.socios?.[0]

    return {
      razaoSocial: data.razao_social ?? null,
      nomeFantasia: data.estabelecimento?.nome_fantasia ?? null,
      setor: data.cnae_fiscal_descricao ?? null,
      email: data.estabelecimento?.email ?? null,
      socioAdministrador: socioAdmin?.nome ?? null,
      error: null,
    }
  } catch {
    return {
      razaoSocial: null, nomeFantasia: null, setor: null,
      email: null, socioAdministrador: null,
      error: 'Erro ao consultar Receita Federal. Tente novamente.',
    }
  }
}
