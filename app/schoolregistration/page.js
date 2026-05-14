"use client";

import "./page.css";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

const INDIAN_STATES = [

  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",

  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
]
export default function SchoolRegistrationPage() {

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

 const [form, setForm] = useState({
  schoolName: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  state: "",
});

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setMessage("");

    try {

      // CHECK DUPLICATE REQUEST

      const { data: existingRequest } =
        await supabase
          .from("school_registration_requests")
          .select("*")
          .eq("phone", form.phone)
          .maybeSingle();

      if (existingRequest) {

        setMessage(
          "A registration request already exists for this mobile number."
        );

        setLoading(false);

        return;

      }

      // CREATE REQUEST

      const { error } = await supabase
        .from("school_registration_requests")
        .insert([
          {
            school_name: form.schoolName,
            coordinator_first_name: form.firstName,
            coordinator_last_name: form.lastName,
            phone: form.phone,
            email: form.email,
            city: form.city,
            district: form.district,
            state: form.state,
          },
        ]);

      if (error) {
        throw error;
      }

      setMessage(
        "School registration request submitted successfully. Our team will contact you shortly."
      );

      setForm({
        schoolName: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        city: "",
        district: "",
        state: "",
      });

    } catch (err) {

      console.error(err);

      setMessage("Something went wrong.");

    }

    setLoading(false);

  };

  return (
    <main className="school-page">

      <div className="school-overlay"></div>

      <div className="school-card">

        <div className="top-badge">
          AURELIUS NATIONAL OLYMPIAD
        </div>

        <h1>
          School Registration
        </h1>

        <p className="subtext">
          Register your school for Aurelius National Olympiad participation.
          Our team will review your request and contact your coordinator for
          onboarding, student uploads, and participation confirmation.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="grid">

            <div className="field">

              <label>
                School Name*
              </label>

              <input
                type="text"
                name="schoolName"
                value={form.schoolName}
                onChange={handleChange}
                placeholder="Enter School Name"
                required
              />

            </div>

            <div className="field">

              <label>
                Coordinator First Name*
              </label>

              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First Name"
                required
              />

            </div>

            <div className="field">

              <label>
                Coordinator Last Name*
              </label>

              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                required
              />

            </div>

            <div className="field">

              <label>
                Mobile Number*
              </label>

              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter Mobile Number"
                required
              />

            </div>

            <div className="field">

              <label>
                Email Address*
              </label>

<input
  type="email"
  name="email"
  value={form.email}
  onChange={handleChange}
  placeholder="Enter Email Address"
  required
/>

            </div>
<div className="field">

  <label>
    City / Town*
  </label>

  <input
    type="text"
    name="city"
    value={form.city}
    onChange={handleChange}
    placeholder="City or Town"
    required
  />

</div>
            <div className="field">

              <label>
                District*
              </label>

              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="District"
                required
              />

            </div>

            <div className="field full">

              <label>
                State*
              </label>

           <select
  name="state"
  value={form.state}
  onChange={handleChange}
  required
  style={{
    width: "100%",
    height: "60px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(8,15,40,0.95)",
    color: "#fff",
    padding: "0 18px",
    fontSize: "16px",
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  }}
>

  <option value="">
    Select State
  </option>

  {INDIAN_STATES.map(state => (

    <option
      key={state}
      value={state}
      style={{
        color: "#000"
      }}
    >

      {state}

    </option>

  ))}

</select>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >

            {loading
              ? "Submitting..."
              : "Submit Registration Request"}

          </button>

        </form>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>

    </main>
  );
}
