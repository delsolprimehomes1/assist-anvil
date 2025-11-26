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

// ============================================
// CREDIT & DEBT CALCULATOR FUNCTIONS
// ============================================

/**
 * Calculate credit card payoff timeline
 */
export const calculateCreditCardPayoff = (
  balance: number,
  apr: number,
  minPaymentPercent: number,
  minPaymentFloor: number,
  extraPayment: number = 0
): {
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
} => {
  const monthlyRate = apr / 100 / 12;
  const minPayment = Math.max(balance * (minPaymentPercent / 100), minPaymentFloor);
  const payment = minPayment + extraPayment;

  if (payment <= balance * monthlyRate) {
    // Payment doesn't cover interest - infinite payoff
    return {
      monthsToPayoff: 999,
      totalInterest: balance * 10,
      totalPaid: balance * 11
    };
  }

  // Calculate months to payoff
  const monthsToPayoff = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
  );

  const totalPaid = payment * monthsToPayoff;
  const totalInterest = totalPaid - balance;

  return {
    monthsToPayoff: Math.max(1, monthsToPayoff),
    totalInterest: Math.max(0, totalInterest),
    totalPaid
  };
};

/**
 * Calculate loan payoff timeline
 */
export const calculateLoanPayoff = (
  balance: number,
  apr: number,
  monthlyPayment: number
): {
  monthsRemaining: number;
  payoffDate: string;
  totalInterest: number;
} => {
  const monthlyRate = apr / 100 / 12;

  if (monthlyPayment <= balance * monthlyRate) {
    return {
      monthsRemaining: 999,
      payoffDate: "Never (payment too low)",
      totalInterest: balance * 10
    };
  }

  const monthsRemaining = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
  );

  const totalPaid = monthlyPayment * monthsRemaining;
  const totalInterest = totalPaid - balance;

  // Calculate payoff date
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining);
  const formattedDate = payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    monthsRemaining: Math.max(1, monthsRemaining),
    payoffDate: formattedDate,
    totalInterest: Math.max(0, totalInterest)
  };
};

/**
 * Calculate loan payment (PMT formula)
 */
export const calculateLoanPayment = (
  amount: number,
  rate: number,
  termMonths: number
): {
  monthlyPayment: number;
  totalCost: number;
  totalInterest: number;
} => {
  const monthlyRate = rate / 100 / 12;

  if (monthlyRate === 0) {
    // No interest
    const monthlyPayment = amount / termMonths;
    return {
      monthlyPayment,
      totalCost: amount,
      totalInterest: 0
    };
  }

  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1);

  const totalCost = monthlyPayment * termMonths;
  const totalInterest = totalCost - amount;

  return {
    monthlyPayment,
    totalCost,
    totalInterest: Math.max(0, totalInterest)
  };
};

/**
 * Estimate remaining balance from payment info
 */
export const estimateRemainingBalance = (
  monthlyPayment: number,
  rate: number,
  monthsRemaining: number
): {
  balance: number;
  totalAlreadyPaid: number;
  remainingInterest: number;
} => {
  const monthlyRate = rate / 100 / 12;

  if (monthlyRate === 0) {
    const balance = monthlyPayment * monthsRemaining;
    return {
      balance,
      totalAlreadyPaid: 0,
      remainingInterest: 0
    };
  }

  // Present value of annuity formula
  const balance = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -monthsRemaining)) / monthlyRate);
  const totalToPay = monthlyPayment * monthsRemaining;
  const remainingInterest = totalToPay - balance;

  return {
    balance: Math.max(0, balance),
    totalAlreadyPaid: balance * 0.3, // Rough estimate
    remainingInterest: Math.max(0, remainingInterest)
  };
};

// ============================================
// DEBT INSIGHT GENERATORS
// ============================================

export const getCreditCardInsight = (
  monthsToPayoff: number,
  totalInterest: number,
  balance: number,
  extraPayment: number
): string => {
  const interestPercent = (totalInterest / balance) * 100;
  
  if (monthsToPayoff > 60) {
    return "Minimum payments are designed to keep you trapped — not debt-free. Every extra dollar attacks YEARS of interest.";
  }
  
  if (interestPercent > 50) {
    return `You'll pay ${interestPercent.toFixed(0)}% in interest alone. Interest is silent theft — but it's optional.`;
  }
  
  if (extraPayment > 0) {
    return "Every extra dollar you pay goes straight to destroying the principal — not lining the bank's pocket.";
  }
  
  return "Banks sell convenience — and collect slavery. The faster you pay, the more of YOUR money you keep.";
};

export const getLoanPayoffInsight = (totalInterest: number, originalBalance: number): string => {
  const interestPercent = (totalInterest / originalBalance) * 100;
  
  if (interestPercent > 40) {
    return `You're not paying for the loan. You're paying for TIME. ${interestPercent.toFixed(0)}% of your payments go to interest.`;
  }
  
  if (interestPercent > 25) {
    return "Most people underestimate their total interest by 30-50%. You're seeing the truth now.";
  }
  
  return "Extra payments reduce the future — not just the balance. Every dollar over the minimum cuts months off your sentence.";
};

export const getLoanPaymentInsight = (
  monthlyPayment: number,
  totalInterest: number,
  termMonths: number
): string => {
  if (termMonths > 72) {
    return "Longer loans equal smaller payments — and bigger losses. The term is the real enemy, not the rate.";
  }
  
  if (totalInterest > monthlyPayment * 12) {
    return "You'll pay more than a year's worth of payments in pure interest. Cheap payments are expensive freedom.";
  }
  
  return "The interest rate is not the enemy. The term is. Shorter terms mean less time for interest to compound against you.";
};

export const getBalanceInsight = (remainingBalance: number, monthsRemaining: number): string => {
  const yearsRemaining = monthsRemaining / 12;
  
  if (yearsRemaining > 4) {
    return "You don't just owe money — you owe FUTURE time. Every payment has two jobs: interest and escape.";
  }
  
  if (monthsRemaining < 24) {
    return "You're in the home stretch. The finish line is visible now. Stay consistent.";
  }
  
  return "Debt is rent on your own life. The sooner you're free, the sooner you control your future.";
};