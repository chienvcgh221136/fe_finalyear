export interface UpgradeOption {
    packageId: string;
    name: string;
    price: number;
    description: string;
    upgradeCost: number;
    residualValue: number;
    originalPrice: number;
    priorityScore: number;
    perks?: string[];
}

export interface UpgradeInfo {
    currentPackage: {
        packageId: string;
        name: string;
        price: number;
        remainingDays: number;
        residualValue: number;
        expiredAt: string;
    };
    upgradeOptions: UpgradeOption[];
}
