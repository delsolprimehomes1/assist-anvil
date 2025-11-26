// Life expectancy data by gender and age (US CDC 2023 data)
export const lifeExpectancyData: Record<'male' | 'female', Record<number, number>> = {
  male: {
    25: 76.5, 30: 76.8, 35: 77.1, 40: 77.5, 45: 78.0, 50: 78.7,
    55: 79.6, 60: 80.8, 65: 82.3, 70: 84.2, 75: 86.5, 80: 89.2
  },
  female: {
    25: 81.2, 30: 81.4, 35: 81.7, 40: 82.0, 45: 82.5, 50: 83.1,
    55: 84.0, 60: 85.1, 65: 86.5, 70: 88.2, 75: 90.3, 80: 92.8
  }
};

export const getLifeExpectancy = (age: number, gender: 'male' | 'female'): { min: number; max: number; average: number } => {
  const data = lifeExpectancyData[gender];
  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);
  
  // Find closest age bracket
  let closestAge = ages[0];
  for (const a of ages) {
    if (Math.abs(a - age) < Math.abs(closestAge - age)) {
      closestAge = a;
    }
  }
  
  const average = data[closestAge];
  return {
    min: average - 3,
    max: average + 5,
    average
  };
};

export const calculateLifetimeEarnings = (
  currentAge: number,
  retirementAge: number,
  currentIncome: number,
  annualIncrease: number
): { totalEarnings: number; yearsRemaining: number; incomeAtRetirement: number } => {
  const yearsRemaining = retirementAge - currentAge;
  let totalEarnings = 0;
  let income = currentIncome;
  
  for (let i = 0; i < yearsRemaining; i++) {
    totalEarnings += income;
    income *= (1 + annualIncrease / 100);
  }
  
  return {
    totalEarnings,
    yearsRemaining,
    incomeAtRetirement: income / (1 + annualIncrease / 100) // Last year's income
  };
};

export const calculateInsuranceLongevity = (
  insuranceAmount: number,
  monthlyNeeds: number,
  inflationRate: number,
  returnRate: number,
  taxRate: number
): { yearsLasting: number; monthlyDepletion: number[]; shortfall: boolean } => {
  let balance = insuranceAmount * (1 - taxRate / 100);
  const netReturnRate = (returnRate - inflationRate) / 100 / 12;
  const monthlyDepletion: number[] = [];
  let months = 0;
  
  while (balance > 0 && months < 600) { // Max 50 years
    balance = balance * (1 + netReturnRate) - monthlyNeeds;
    monthlyDepletion.push(Math.max(0, balance));
    months++;
  }
  
  return {
    yearsLasting: months / 12,
    monthlyDepletion,
    shortfall: months < 240 // Less than 20 years is considered a shortfall
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getLifeExpectancyInsight = (remainingYears: number): string => {
  if (remainingYears > 50) {
    return "People consistently underestimate how long they'll live. Planning for longevity is crucial.";
  } else if (remainingYears > 30) {
    return "You likely have decades ahead. Most underestimate their lifespan by 10-15 years.";
  } else if (remainingYears > 15) {
    return "Longevity risk is real — outliving your money is more common than you think.";
  }
  return "Every year matters. Planning should account for the possibility of living longer than expected.";
};

export const getEarningsInsight = (totalEarnings: number, yearsRemaining: number): string => {
  if (totalEarnings > 5000000) {
    return "Your earning power is your greatest asset. If it stops, everything stops. Protection isn't optional.";
  } else if (totalEarnings > 2000000) {
    return `You'll earn over ${formatCurrency(totalEarnings)} — your most valuable asset isn't your job, it's your ability to earn.`;
  } else if (totalEarnings > 1000000) {
    return "Most people don't realize they're millionaires in earning potential. This number should be protected.";
  }
  return `In ${yearsRemaining} years, you'll earn ${formatCurrency(totalEarnings)}. That's worth protecting.`;
};

export const getInsuranceInsight = (yearsLasting: number): string => {
  if (yearsLasting < 10) {
    return "Critical Alert: Your coverage would only last a few years. Most families discover this too late.";
  } else if (yearsLasting < 20) {
    return "Your insurance would be depleted before your family's needs end. This is the coverage gap most don't see.";
  } else if (yearsLasting < 30) {
    return "Adequate short-term, but consider: Will your family's needs really end in 20 years?";
  }
  return "Strong coverage duration, but always account for inflation and unexpected expenses.";
};

export const getCommissionInsight = (annualIncome: number): string => {
  if (annualIncome > 150000) {
    return "Income is controlled by math — not motivation. You're proving it.";
  } else if (annualIncome > 75000) {
    return "Protection sold today becomes income tomorrow. Consistency compounds.";
  }
  return "Most agents dramatically underestimate their scaling potential. Small changes create exponential results.";
};