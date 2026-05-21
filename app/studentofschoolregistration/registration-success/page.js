"use client";

import Link from "next/link";

export default function RegistrationSuccessPage() {

  return (

    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#020617,#0f172a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          background:
            "rgba(15,23,42,0.95)",
          border:
            "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          padding: "50px",
          color: "#fff",
          boxShadow:
            "0 20px 80px rgba(0,0,0,0.45)",
        }}
      >

        <div
          style={{
            fontSize: "70px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          🎉
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "40px",
            marginBottom: "16px",
            fontWeight: "700",
          }}
        >
          Registration Successful
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "18px",
            color: "#cbd5e1",
            marginBottom: "40px",
            lineHeight: "1.7",
          }}
        >
          Your payment has been received
          successfully for the Aurelius
          National Olympiad.
        </p>

        <div
          style={{
            background:
              "rgba(255,255,255,0.04)",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "30px",
          }}
        >

          <h2
            style={{
              marginBottom: "18px",
              fontSize: "24px",
            }}
          >
            What Happens Next?
          </h2>

          <ul
            style={{
              lineHeight: "2",
              color: "#e2e8f0",
              paddingLeft: "20px",
            }}
          >

            <li>
              Your registration has
              been confirmed.
            </li>

            <li>
              Hall ticket and exam
              login credentials will
              be shared before the
              exam date.
            </li>

            <li>
              Updates will be sent to
              your registered email
              and WhatsApp number.
            </li>

            <li>
              Please keep your mobile
              number active for exam
              notifications.
            </li>

          </ul>

        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "35px",
          }}
        >

          <Link
            href="/"
            style={{
              background:
                "#2563eb",
              padding:
                "14px 30px",
              borderRadius: "14px",
              color: "#fff",
              textDecoration:
                "none",
              fontWeight: "600",
              display:
                "inline-block",
            }}
          >
            Back To Home
          </Link>

        </div>

      </div>

    </main>
  );
}
