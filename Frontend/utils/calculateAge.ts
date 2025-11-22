export const calculateAge = (
  birthDateStr: string | string[] | undefined
): number => {
  if (!birthDateStr) return 0;

  const dateStr = Array.isArray(birthDateStr) ? birthDateStr[0] : birthDateStr;

  try {
    let birthDate: Date;

    // Detectar se é formato ISO (YYYY-MM-DDTHH:MM:SS.SSSZ ou YYYY-MM-DD)
    if (dateStr.includes("T") || dateStr.includes("-")) {
      // Formato ISO: 1998-03-03T03:00:00.000Z
      birthDate = new Date(dateStr);
      if (isNaN(birthDate.getTime())) {
        console.error("Data ISO inválida:", dateStr);
        return 0;
      }
    } else if (dateStr.includes("/")) {
      // Formato DD/MM/YYYY
      const parts = dateStr.trim().split("/");
      if (parts.length !== 3) {
        console.error("Formato de data inválido. Use DD/MM/YYYY:", dateStr);
        return 0;
      }

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.error("Data contém valores inválidos:", dateStr);
        return 0;
      }

      birthDate = new Date(year, month - 1, day);
    } else {
      console.error("Formato de data não reconhecido:", dateStr);
      return 0;
    }

    const today = new Date();

    // Calcular diferença de anos
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Ajustar se ainda não completou aniversário neste ano
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return Math.max(0, age);
  } catch (error) {
    console.error("Erro ao calcular idade:", error);
    return 0;
  }
};
