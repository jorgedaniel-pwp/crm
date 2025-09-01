import Link from "next/link";

export default function Hero() {
  return (
    <section className="text-center my-32 mx-4 sm:mx-8 md:mx-16 lg:mx-24">
      <h1 className="font-sans text-4xl tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-white mb-6">
        Dataverse Backend CRM
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 font-light">
        Manage your customer relationships with Microsoft Dataverse integration
      </p>
    </section>
  );
}
