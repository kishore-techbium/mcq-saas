"use client";

import "./page.css";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SchoolRegistrationPage() {

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    schoolName: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
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

      // CHECK EXISTING SCHOOL ADMIN

      const { data: existingUser } = await supabase
        .from("students")
        .select("*")
        .eq("phone", form.phone)
        .eq("role", "school_admin")
        .maybeSingle();

      // EXISTING SCHOOL

      if (existingUser) {

        const { error: updateError } = await supabase
          .from("students")
          .update({
            district: form.district,
            address: form.state,
            college_name: form.schoolName,
          })
          .eq("id", existingUser.id);

        if (updateError) {
          throw updateError;
        }

        setMessage(
          "Existing school account found. Aurelius registration updated successfully."
        );

      } else {

        // CREATE NEW SCHOOL ADMIN

        const loginId =
          "SCH" +
          Math.floor(
            100000 + Math.random() * 900000
          );

        const password =
          Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();

        const { error } = await supabase
          .from("students")
          .insert([
            {
              first_name: form.firstName,
              last_name: form.lastName,
              phone: form.phone,
              email: form.email,
              college_name: form.schoolName,
              role: "school_admin",
              login_id: loginId,
              password: password,
              address: form.state,
              district: form.district,
              is_active: true,
            },
          ]);

        if (error) {
          throw error;
        }

        setMessage(
          `School registered successfully. Login ID: ${loginId}`
        );

      }

      setForm({
        schoolName: "",
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
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
          Student Excel uploads and payment verification can be completed later
          through the school dashboard.
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
                placeholder="Enter Email"
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
          >

            {loading
              ? "Registering..."
              : "Register School"}

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
