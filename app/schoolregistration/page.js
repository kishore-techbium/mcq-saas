"use client";

import "./page.css";

import { useState } from "react";

import { supabase } from '../../lib/supabase'

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

  const handleGoogleLogin = async () => {

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          `${window.location.origin}/schoolregistration`,
      },
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    setMessage("");

    try {

      // CHECK IF SCHOOL ADMIN ALREADY EXISTS

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
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            college_name: form.schoolName,
            address: form.state,
            district: form.district,
            is_active: true,
          })
          .eq("id", existingUser.id);

        if (updateError) {
          throw updateError;
        }

        setMessage(
          "Existing school account updated successfully."
        );

      } else {

        // CREATE NEW SCHOOL ADMIN

        const { data: collegeInsert, error: collegeError } =
          await supabase
            .from("colleges")
            .insert([
              {
                name: form.schoolName,
                type: "school",
                district: form.district,
                state: form.state,
                is_active: true,
              },
            ])
            .select()
            .single();

        if (collegeError) {
          throw collegeError;
        }

        const collegeId = collegeInsert.id;

        const { error: studentError } =
          await supabase
            .from("students")
            .insert([
              {
                first_name: form.firstName,
                last_name: form.lastName,
                phone: form.phone,
                email: form.email,
                role: "school_admin",
                college_id: collegeId,
                college_name: form.schoolName,
                address: form.state,
                district: form.district,
                is_active: true,
              },
            ]);

        if (studentError) {
          throw studentError;
        }

        setMessage(
          "School registered successfully"
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
          Student uploads can be completed later
          through your school dashboard.
        </p>


        <div className="divider">

        </div>

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
