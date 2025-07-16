import MultipleFacebookSection from "@/components/MultipleFacebookSection";
import Layout from "@/components/Layout";

export default function FacebookMultiplePage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">חיבורי פייסבוק מרובים</h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto">
          נהל מספר חשבונות פייסבוק או עמודים שונים במקביל. התחבר לחשבונות נוספים כדי לנהל תוכן ממספר מקורות.
        </p>
        <MultipleFacebookSection />
      </div>
    </Layout>
  );
}