import { AffiliateSettingsTab } from "./affiliates/AffiliateSettingsTab";
import { PayoutManagementTab } from "./affiliates/PayoutManagementTab";
import { AmbassadorManagementTab } from "./affiliates/AmbassadorManagementTab";
import { EarningsOverviewTab } from "./affiliates/EarningsOverviewTab";
import { TaxComplianceTab } from "./affiliates/TaxComplianceTab";
import { MarketingCreativesTab } from "./affiliates/MarketingCreativesTab";
import { FraudDashboardEnhanced } from "./affiliates/FraudDashboardEnhanced";
import { LinkPerformanceAnalytics } from "./affiliates/LinkPerformanceAnalytics";
import { TrackingWidgetGenerator } from "./TrackingWidgetGenerator";

interface AffiliatesAdminProps {
  section?: string;
}

export const AffiliatesAdmin = ({ section = "settings" }: AffiliatesAdminProps) => {
  const renderContent = () => {
    switch (section) {
      case "settings":
        return <AffiliateSettingsTab />;
      case "payouts":
        return <PayoutManagementTab />;
      case "ambassadors":
        return <AmbassadorManagementTab />;
      case "earnings":
        return <EarningsOverviewTab />;
      case "tax":
        return <TaxComplianceTab />;
      case "creatives":
        return <MarketingCreativesTab />;
      case "analytics":
        return <LinkPerformanceAnalytics />;
      case "fraud":
        return <FraudDashboardEnhanced />;
      case "tracking":
        return <TrackingWidgetGenerator />;
      default:
        return <AffiliateSettingsTab />;
    }
  };

  const getTitleAndDescription = () => {
    switch (section) {
      case "settings":
        return { title: "Affiliate Settings", description: "Configure commission rates, tiers, and program settings" };
      case "payouts":
        return { title: "Payout Management", description: "Process and manage ambassador payouts" };
      case "ambassadors":
        return { title: "Ambassador Management", description: "View and manage brand ambassadors" };
      case "earnings":
        return { title: "Earnings Overview", description: "Track affiliate earnings and performance" };
      case "tax":
        return { title: "Tax Compliance", description: "Manage 1099 forms and tax documentation" };
      case "creatives":
        return { title: "Marketing Creatives", description: "Manage promotional materials for ambassadors" };
      case "analytics":
        return { title: "Link Performance Analytics", description: "Analyze referral link performance" };
      case "fraud":
        return { title: "Fraud Detection", description: "Monitor and prevent fraudulent activity" };
      case "tracking":
        return { title: "Tracking Widget", description: "Generate tracking code for your website" };
      default:
        return { title: "Brand Ambassador Program", description: "Manage referrals, commissions, and payouts" };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {renderContent()}
    </div>
  );
};
