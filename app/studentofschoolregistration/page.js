"use client";


import "../schoolregistration/page.css";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function StudentRegistrationPage() {

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

      // CHECK DUPLICATE

      const { data: existingRequest } =
        await supabase
          .from("student_ofschool_registration_requests")
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

      // INSERT REQUEST

      const { error } = await supabase
        .from("student_ofschool_registration_requests")
        .insert([
          {
            school_name: form.schoolName,

            first_name: form.firstName,

            last_name: form.lastName,

            phone: form.phone,

            email: form.email,

            city: form.city,

            district: form.district,

            state: form.state,

            status: "pending",
          },
        ]);

      if (error) {
        throw error;
      }

      setMessage(
        "Student registration request submitted successfully. Our team will contact you shortly."
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
          Student Registration
        </h1>

        <p className="subtext">
          Register as an individual participant for the Aurelius National Olympiad.
          Our team will review your request and contact you shortly.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="grid">

            <div className="field">

              <label>
                Student First Name
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
                Student Last Name
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
                required
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

            <div className="field">

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
