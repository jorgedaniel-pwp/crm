import Header from "components/Header";
import Hero from "components/Hero";
import Footer from "components/Footer";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, TrendingUp, FileText, ShoppingCart } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main>
        <Hero />
        <section className="px-4 sm:px-8 md:px-16 lg:px-24 pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/leads" className="block transition-transform hover:scale-105">
              <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 mb-4">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Leads</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Manage and track potential customers through your sales pipeline
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <div className="block transition-transform hover:scale-105 opacity-75 cursor-not-allowed">
              <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Opportunities</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Track sales opportunities and revenue forecasting
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="block transition-transform hover:scale-105 opacity-75 cursor-not-allowed">
              <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 mb-4">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Quotes</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Create and manage customer quotes and proposals
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="block transition-transform hover:scale-105 opacity-75 cursor-not-allowed">
              <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 mb-4">
                    <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white">Orders</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Process and track customer orders and fulfillment
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      {/* <Footer /> */}
    </div>
  );
}
