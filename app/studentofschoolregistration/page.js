"use client";

import "../schoolregistration/page.css";

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
export default function StudentRegistrationPage() {

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [subjects, setSubjects] =
    useState([]);

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

  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubjectChange(
    subject
  ) {

    if (
      subjects.includes(subject)
    ) {

      setSubjects(
        subjects.filter(
          s => s !== subject
        )
      );

    } else {

      setSubjects([
        ...subjects,
        subject,
      ]);
    }
  }

  async function handleSubmit(e) {

    e.preventDefault();

    setLoading(true);

    setMessage("");

    try {

      const {
        data: existing
      } = await supabase
        .from(
          "student_ofschool_registration_requests"
        )
        .select("*")
        .eq("phone", form.phone)
        .maybeSingle();

      if (existing) {

        setMessage(
          "A request already exists for this mobile number."
        );

        setLoading(false);

        return;
      }

      const { error } =
        await supabase
          .from(
            "student_ofschool_registration_requests"
          )
          .insert([
            {
              school_name:
                form.schoolName,

              first_name:
                form.firstName,

              last_name:
                form.lastName,

              phone:
                form.phone,

              email:
                form.email,

              city:
                form.city,

              district:
                form.district,

              state:
                form.state,

              selected_subjects:
                subjects,

              status:
                "pending",
            },
          ]);

      if (error) {
        throw error;
      }

      setMessage(
        "Registration request submitted successfully."
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

      setSubjects([]);

    } catch (err) {

      console.log(err);

      setMessage(
        "Something went wrong."
      );
    }

    setLoading(false);
  }

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
          Register for the Aurelius
          National Olympiad.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="grid">

            <div className="field">

              <label>
                First Name*
              </label>

              <input
                type="text"
                name="firstName"
                value={
                  form.firstName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter First Name"
                required
              />

            </div>

            <div className="field">

              <label>
                Last Name(Surname)*
              </label>

              <input
                type="text"
                name="lastName"
                value={
                  form.lastName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter Last Name"
                required
              />

            </div>

            <div className="field">

              <label>
                School Name*
              </label>

              <input
                type="text"
                name="schoolName"
                value={
                  form.schoolName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter School Name"
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
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.city
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.district
                }
                onChange={
                  handleChange
                }
                placeholder="District"
                required
              />

            </div>

            <div className="field">

              <label>
                State*
              </label>

            <select
  name="state"
  value={form.state}
  onChange={handleChange}
  required
>

  <option value="">
    Select State
  </option>

  {INDIAN_STATES.map(state => (

    <option
      key={state}
      value={state}
    >

      {state}

    </option>

  ))}

</select>

            </div>

          </div>

          {/* SUBJECTS */}

          <div
            style={{
              marginTop: 30,
            }}
          >

            <label
              style={{
                display: "block",
                marginBottom: 20,
                fontWeight: 600,
                color: "#fff",
                fontSize: 18,
              }}
            >
              Select Olympiad Subjects
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 20,
              }}
            >

              {[
                {
                  label:
                    "GK Olympiad",
                  value:
                    "GK_OLYMPIAD",
                },

                {
                  label:
                    "Maths Olympiad",
                  value:
                    "MATHS_OLYMPIAD",
                },

                {
                  label:
                    "Science Olympiad",
                  value:
                    "SCIENCE_OLYMPIAD",
                },

                {
                  label:
                    "Mental Ability Olympiad",

                  value:
                    "MENTAL_ABILITY_OLYMPIAD",
                },
              ].map(sub => (

                <label
                  key={sub.value}
                  style={{
                    height: 62,
                    border:
                      "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 20,
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 14,
                    padding:
                      "0 20px",
                    background:
                      subjects.includes(
                        sub.value
                      )
                        ? "rgba(99,102,241,0.18)"
                        : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    transition:
                      "0.3s",
                  }}
                >

                  <input
                    type="checkbox"
                    checked={subjects.includes(
                      sub.value
                    )}
                    onChange={() =>
                      handleSubjectChange(
                        sub.value
                      )
                    }
                    style={{
                      width: 20,
                      height: 20,
                      cursor:
                        "pointer",
                    }}
                  />

                  <span
                    style={{
                      color:
                        "#fff",
                      fontSize: 16,
                      fontWeight: 500,
                    }}
                  >
                    {sub.label}
                  </span>

                </label>

              ))}

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
            style={{
              marginTop: 35,
            }}
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
