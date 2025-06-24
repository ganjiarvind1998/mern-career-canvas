
// import { Routes, Route, Navigate } from "react-router-dom";
// import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
// import Home from "./pages/Home";
// import Resume from "./pages/Resume";
// import CoverLetter from "./pages/CoverLetter";

// function ProtectedRoute({ children }) {
//   return (
//     <>
//       <SignedIn>{children}</SignedIn>
//       <SignedOut>
//         <Navigate to="/sign-in" />
//       </SignedOut>
//     </>
//   );
// }

// function App() {
//   return (
//     <div className="min-h-screen">
//       <Routes>
//         {/* Sign In */}
//         <Route
//           path="/sign-in/*"
//           element={
//             <div className="flex items-center justify-center min-h-screen">
//               <SignIn
//                 routing="path"
//                 path="/sign-in"
//                 signUpUrl="/sign-up"
//                 afterSignInUrl="/"
//               />
//             </div>
//           }
//         />

//         {/* Sign Up */}
//         <Route
//           path="/sign-up/*" // <-- allow nested SSO callback route
//           element={
//             <div className="flex items-center justify-center min-h-screen">
//               <SignUp
//                 routing="path"
//                 path="/sign-up"
//                 signInUrl="/sign-in"
//                 afterSignUpUrl="/"
//               />
//             </div>
//           }
//         />

//         {/* Protected Routes */}
//         <Route
//           path="/"
//           element={
//             <ProtectedRoute>
//               <Home />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/resume"
//           element={
//             <ProtectedRoute>
//               <Resume />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/coverletter"
//           element={
//             <ProtectedRoute>
//               <CoverLetter />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//     </div>
//   );
// }

// export default App;
import { Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import Home from "./pages/Home";
import Resume from "./pages/Resume";
import CoverLetter from "./pages/CoverLetter";

// 🔒 Protects routes based on auth state
function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" />
      </SignedOut>
    </>
  );
}

// 🎨 Custom Auth Page Layout with Golden Gradient Background
function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fff7e6] via-[#ffeadd] to-[#fdf2f8]">
      <div className="w-full max-w-md flex justify-center">{children}</div>
    </div>
  );
}

// 🎨 Clerk UI Styling
const clerkAppearance = {
  elements: {
    card: "bg-white/90 shadow-xl rounded-2xl px-6 py-8",
    headerTitle: "text-gray-800 text-xl font-bold",
    headerSubtitle: "text-gray-500 text-sm",
    socialButtonsBlockButton: "border-gray-300 text-gray-700",
    footerActionText: "text-sm text-gray-500",
    footerActionLink: "text-yellow-600 hover:underline",
  },
};

// 🚀 Main App Component
function App() {
  return (
    <div className="min-h-screen">
      <Routes>

        {/* 👤 Sign In */}
        <Route
          path="/sign-in/*"
          element={
            <AuthLayout>
              <SignIn
                appearance={clerkAppearance}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                afterSignInUrl="/"
              />
            </AuthLayout>
          }
        />

        {/* 📝 Sign Up */}
        <Route
          path="/sign-up/*"
          element={
            <AuthLayout>
              <SignUp
                appearance={clerkAppearance}
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                afterSignUpUrl="/"
              />
            </AuthLayout>
          }
        />

        {/* 🔒 Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coverletter"
          element={
            <ProtectedRoute>
              <CoverLetter />
            </ProtectedRoute>
          }
        />

        {/* 🌐 Catch-All Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
