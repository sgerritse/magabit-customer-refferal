import { EmailNotifications } from "./notifications/EmailNotifications";
import { SMSNotifications } from "./notifications/SMSNotifications";
import { PushNotifications } from "./notifications/PushNotifications";
import { EmailSequenceBuilder } from "./notifications/EmailSequenceBuilder";
import { AmbassadorEmailTemplates } from "./notifications/AmbassadorEmailTemplates";

interface NotificationsAdminProps {
  section?: string;
}

export const NotificationsAdmin = ({ section = "email" }: NotificationsAdminProps) => {
  const renderContent = () => {
    switch (section) {
      case "email":
        return <EmailNotifications />;
      case "sms":
        return <SMSNotifications />;
      case "push":
        return <PushNotifications />;
      case "sequences":
        return <EmailSequenceBuilder />;
      case "ambassador":
        return <AmbassadorEmailTemplates />;
      default:
        return <EmailNotifications />;
    }
  };

  const getTitleAndDescription = () => {
    switch (section) {
      case "email":
        return { title: "Email Notifications", description: "Configure email settings, templates, and triggers" };
      case "sms":
        return { title: "SMS Notifications", description: "Set up SMS messaging and templates" };
      case "push":
        return { title: "Push Notifications", description: "Manage push notification settings" };
      case "sequences":
        return { title: "Email Sequences", description: "Build automated email sequences" };
      case "ambassador":
        return { title: "Ambassador Email Templates", description: "Manage email templates for ambassadors" };
      default:
        return { title: "Notifications Management", description: "Configure notification settings, templates, and triggers" };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-foreground/80 mt-1">{description}</p>
      </div>
      {renderContent()}
    </div>
  );
};
