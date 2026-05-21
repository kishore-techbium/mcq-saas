import Script from "next/script";

export const metadata = {
  title: "Examination",
  description: "Online Exam Portal",
};

export default function RootLayout({
  children,
}) {

  return (
    <html lang="en">

      <body>

        <Script src="https://checkout.razorpay.com/v1/checkout.js" />

        {children}

      </body>

    </html>
  );
}
