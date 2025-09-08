//import { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
//import apiInstance from "../utils/axios.js";

function DatosBase() {
  return (
    <>
      <SignedIn>
        <section className="baseform-signedin">
          <div>
            <div className="form-container"></div>
          </div>
        </section>
      </SignedIn>

      <SignedOut>
        <section className="baseform-signedout">
          <div className="disclaimer-container">
            <h3>Es necesario iniciar sesion para usar a la herramienta.</h3>
          </div>
        </section>
      </SignedOut>
    </>
  );
}

export default DatosBase;
