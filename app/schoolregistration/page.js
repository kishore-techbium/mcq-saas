"use client";

import "./page.css";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

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
                School Name
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
                Coordinator First Name
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
                Coordinator Last Name
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
                Mobile Number
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
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter Email Address"
              />

            </div>
<div className="field">

  <label>
    City / Town
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
                District
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
                State
              </label>

              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
                required
              />

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
