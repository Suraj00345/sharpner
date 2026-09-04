import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaChevronDown,
  FaPlus,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import { toast } from "react-toastify"; // Added missing import
import Spinner from "../../utils/Spinner";

import useLoginStore from "../../store/useLoginStore";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/useThemeStore";

import countries from "../../utils/countries";
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const avatars = [
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe",
];

import {
  sendOtp,
  updateUserProfile,
  verifyOtp,
} from "../../services/user.service";

// Validation schemas
const loginValidationSchema = yup
  .object({
    phoneNumber: yup
      .string()
      .nullable()
      .notRequired()
      .matches(/^\d+$/, {
        message: "Phone number must contain only digits",
        excludeEmptyString: true,
      })
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value,
      ),
    email: yup
      .string()
      .nullable()
      .notRequired()
      .email("Please enter a valid email")
      .transform((value, originalValue) =>
        originalValue?.trim() === "" ? null : value,
      ),
  })
  .test(
    "at-least-one",
    "Either email or phone number is required",
    function (value) {
      return !!(value?.phoneNumber || value?.email);
    },
  );

const otpValidationSchema = yup.object({
  otp: yup
    .string()
    .matches(/^\d{6}$/, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

const profileValidationSchema = yup.object({
  username: yup.string().required("Username is required"),
  agreed: yup.boolean().oneOf([true], "You must agree to the terms"),
});

const Login = () => {
  const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } =
    useLoginStore();
  const { setUser } = useUserStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showDropDown, setShowDropDown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forms bound to React Hook Form schema validation
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  });

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue,
  } = useForm({
    resolver: yupResolver(otpValidationSchema),
  });

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: yupResolver(profileValidationSchema),
  });

  const filterCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const onLoginSubmit = async (data) => {
    try {
      setError("");
      setLoading(true);
      if (data.email) {
        const response = await sendOtp(null, null, data.email);
        if (response.status === "success") {
          toast.info("OTP sent to your email");
          setUserPhoneData({ email: data.email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(
          data.phoneNumber,
          selectedCountry.dialCode,
        );
        if (response.status === "success") {
          toast.info("OTP sent to your phone number");
          setUserPhoneData({
            phoneNumber: data.phoneNumber,
            phoneSuffix: selectedCountry.dialCode,
          });
          setStep(2);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async () => {
    try {
      setError("");
      setLoading(true);
      if (!userPhoneData) throw new Error("Phone or email data is missing");

      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        response = await verifyOtp(
          userPhoneData.phoneNumber,
          userPhoneData.phoneSuffix,
          otpString,
        );
      }

      if (response.status === "success") {
        toast.success("OTP verified successfully");
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to WhatsApp");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setError("");
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);
      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("ProfilePicture", selectedAvatar);
      }

      await updateUserProfile(formData);
      toast.success("Welcome to WhatsApp");
      navigate("/");
      resetLoginState();
    } catch (err) {
      setError(err.message || "Failed to update User Profile");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    const fullOtp = newOtp.join("");
    setOtpValue("otp", fullOtp, { shouldValidate: true });

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  const ProgressBar = () => (
    <div
      className={`w-full ${
        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
      } rounded-full h-2.5 mb-6`}
    >
      <div
        className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-green-400 to-blue-500 text-gray-800"
      } flex items-center justify-center p-4 overflow-hidden transition-colors duration-300`}
    >
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white"
        } p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.2,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <FaWhatsapp className="w-16 h-16 text-white" />
        </motion.div>

        <h1
          className={`text-3xl font-bold text-center mb-6 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          WhatsApp Login
        </h1>

        <ProgressBar />

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Step 1 - Phone or Email Login */}
        {step === 1 && (
          <form
            className="space-y-4"
            onSubmit={handleLoginSubmit(onLoginSubmit)}
          >
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              } mb-4`}
            >
              Enter your phone number or email to receive an OTP
            </p>
            <div className="relative">
              <div className="flex">
                <div className="relative w-1/3">
                  <button
                    type="button"
                    className={`w-full flex-shrink-0 z-10 inline-flex items-center justify-between py-2.5 px-4 text-sm font-medium ${
                      theme === "dark"
                        ? "text-white bg-gray-600 border-gray-500"
                        : "text-gray-900 bg-gray-100 border-gray-300"
                    } border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`}
                    onClick={() => setShowDropDown(!showDropDown)}
                  >
                    <span>
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </span>
                    <FaChevronDown className="ml-2" />
                  </button>

                  {showDropDown && (
                    <div
                      className={`absolute z-20 w-full mt-1 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-white border-gray-300"
                      } border rounded-md shadow-lg max-h-60 overflow-auto`}
                    >
                      <div
                        className={`sticky top-0 ${
                          theme === "dark" ? "bg-gray-700" : "bg-white"
                        } p-2`}
                      >
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-500 text-white"
                              : "bg-white border-gray-300"
                          } rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>
                      {filterCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowDropDown(false);
                            setSearchTerm("");
                          }}
                          className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${
                            theme === "dark"
                              ? "text-white hover:bg-gray-600"
                              : "text-gray-800 hover:bg-gray-100"
                          }`}
                        >
                          {country.flag} {country.dialCode} {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="tel"
                  {...loginRegister("phoneNumber")}
                  placeholder="Enter phone number"
                  className={`w-2/3 px-4 py-2 border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900"
                  } rounded-e-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    loginErrors.phoneNumber ? "border-red-500" : ""
                  }`}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="flex items-center my-4">
              <div className="flex-grow h-px bg-gray-300" />
              <span className="mx-2 text-gray-500 text-sm font-medium">or</span>
              <div className="flex-grow h-px bg-gray-300" />
            </div>

            <div>
              <div
                className={`flex items-center border rounded-md px-3 py-2 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <FaUser
                  className={`mr-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="email"
                  {...loginRegister("email")}
                  placeholder="Email@gmail.com"
                  className={`w-full bg-transparent focus:outline-none ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                />
              </div>
              {loginErrors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {loginErrors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex justify-center items-center"
            >
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 - OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
            <p
              className={`text-center ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Please enter the 6-digit OTP sent to your{" "}
              {userPhoneData?.email
                ? userPhoneData.email
                : `${userPhoneData?.phoneSuffix || ""} ${
                    userPhoneData?.phoneNumber || ""
                  }`}
            </p>

            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-12 text-center text-lg font-semibold border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    otpErrors.otp ? "border-red-500" : ""
                  }`}
                />
              ))}
            </div>

            {otpErrors.otp && (
              <p className="text-red-500 text-sm">{otpErrors.otp.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex justify-center items-center"
            >
              {loading ? <Spinner /> : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className={`w-full mt-2 ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } py-2 rounded-md transition flex items-center justify-center`}
            >
              <FaArrowLeft className="mr-2" />
              Go back! Wrong Number?
            </button>
          </form>
        )}

        {/* Step 3 - Profile Creation */}
        {step === 3 && (
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-xl font-semibold text-center mb-3">
                Complete Your Profile
              </h2>

              {/* Profile Picture / Upload Circle */}
              <div className="relative w-24 h-24 mb-3">
                <img
                  src={selectedAvatar || profilePicture}
                  alt="Profile preview"
                  className="w-full h-full rounded-full object-cover border-2 border-green-500"
                />
                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300 shadow-md"
                >
                  <FaPlus className="w-4 h-4" />
                </label>
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Optional Avatar Selection Grid */}
              {avatars?.length > 0 && (
                <div className="w-full text-center">
                  <p
                    className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}  mb-2`}
                  >
                    Or choose an avatar:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 overflow-x-auto max-w-full p-1">
                    {avatars.map((avatar, index) => (
                      <img
                        key={index}
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        onClick={() => {
                          setSelectedAvatar(avatar);
                        }}
                        className={`w-12 h-12 rounded-full cursor-pointer border-2 transition ease-in-out  ${
                          selectedAvatar === avatar && !profilePicture
                            ? "border-green-500 scale-110"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium mb-1 items-center text-gray-500 gap-2">
                {" "}
                Username
              </label>
              <input
                type="text"
                {...profileRegister("username")}
                placeholder="Enter username"
                className={`w-full px-4 py-2 border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
              />
              {profileErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {profileErrors.username.message}
                </p>
              )}
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="agreed"
                {...profileRegister("agreed")}
                className={`rounded ${theme === "dark" ? " border-gray-700 text-green-600" : "text-green-500"}  focus:ring-green-500 cursor-pointer`}
              />
              <label
                htmlFor="agreed"
                className="text-sm cursor-pointer select-none"
              >
                I agree to the{" "}
                <a href="#" className="text-red-500 hover:underline">
                  terms and conditions
                </a>
              </label>
            </div>
            {profileErrors.agreed && (
              <p className="text-red-500 text-sm">
                {profileErrors.agreed.message}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition flex justify-center items-center font-medium disabled:opacity-50"
            >
              {loading ? <Spinner /> : "Finish Setup"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
