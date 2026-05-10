// LANDING PAGE — Evoluciona Inteligente
// Estructura base para diseño visual. Secciones definidas con contenido real HAYDE.
// Llevar a Claude Code Design para tratamiento visual.

export default function LandingPage() {
  return (
    <main>

      {/* ═══════════════════════════════════════════
          SECCIÓN 1 — NAV
          Logo + links de navegación + CTA header
      ═══════════════════════════════════════════ */}
      <nav>
        <div className="logo">
          <span>Evoluciona Inteligente</span>
        </div>
        <ul>
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#productos">Productos</a></li>
          <li><a href="#resultados">Resultados</a></li>
        </ul>
        <a href="#agendar">Agendar diagnóstico</a>
      </nav>

      {/* ═══════════════════════════════════════════
          SECCIÓN 2 — HERO
          Headline principal + subheadline + CTA primario
          Visual: imagen/video de fondo o elemento gráfico del sistema
      ═══════════════════════════════════════════ */}
      <section id="hero">
        <div className="etiqueta-superior">
          Sistema de identidad y contenido para negocios
        </div>

        <h1>
          Tu negocio tiene algo que decir.<br />
          El problema es que no tiene un sistema para decirlo.
        </h1>

        <p className="subheadline">
          Evoluciona Inteligente construye el sistema estructural que convierte
          tu experiencia en un lenguaje claro, consistente y que atrae
          a los clientes correctos — sin depender de la inspiración del día.
        </p>

        <div className="ctas">
          <a href="#agendar" className="cta-primario">
            Quiero mi diagnóstico gratuito
          </a>
          <a href="#como-funciona" className="cta-secundario">
            Ver cómo funciona
          </a>
        </div>

        <div className="prueba-rapida">
          <span>+40 negocios con sistema activo</span>
          <span>Identidad · Contenido · Conversión</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 3 — PROBLEMA
          Reconocimiento del dolor del prospecto
          3 situaciones concretas que vive hoy
      ═══════════════════════════════════════════ */}
      <section id="problema">
        <h2>
          ¿Te suena familiar?
        </h2>

        <div className="problemas-grid">
          <div className="problema-item">
            <div className="icono" />
            <h3>Producís contenido pero no convierte</h3>
            <p>
              Publicás seguido, usás ChatGPT, seguís tendencias —
              y aún así los clientes no llegan o no entienden bien qué vendés.
            </p>
          </div>

          <div className="problema-item">
            <div className="icono" />
            <h3>Tu identidad depende del momento</h3>
            <p>
              Cada vez que comunicás tu negocio suena diferente.
              No hay una voz clara, un posicionamiento definido,
              ni un mensaje que se sostenga solo.
            </p>
          </div>

          <div className="problema-item">
            <div className="icono" />
            <h3>Trabajás más de lo que crece el negocio</h3>
            <p>
              Invertís tiempo, energía y dinero en comunicación
              sin saber exactamente qué está funcionando
              ni cómo replicarlo.
            </p>
          </div>
        </div>

        <p className="conclusion-problema">
          No es un problema de esfuerzo. Es un problema de estructura.
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 4 — QUIEBRE / REENCUADRE
          Por qué el contenido solo no alcanza.
          La diferencia entre producir y tener un sistema.
      ═══════════════════════════════════════════ */}
      <section id="quiebre">
        <div className="columna-izquierda">
          <h2>
            El contenido sin sistema es ruido.<br />
            El sistema sin identidad es vacío.
          </h2>
          <p>
            La mayoría de los negocios comunica desde la urgencia:
            un post cuando hay tiempo, una historia cuando hay inspiración,
            una oferta cuando bajan las ventas.
          </p>
          <p>
            Eso no es una estrategia. Es reactividad.
          </p>
          <p>
            Lo que transforma un negocio es tener un sistema que decida
            qué decir, cuándo, cómo y con qué intención —
            antes de abrir cualquier herramienta.
          </p>
        </div>

        <div className="columna-derecha">
          {/* Visual comparativo: sin sistema vs con sistema */}
          <div className="comparativa">
            <div className="sin-sistema">
              <h4>Sin sistema</h4>
              <ul>
                <li>Contenido ad hoc, sin dirección</li>
                <li>Identidad fragmentada</li>
                <li>Sin saber qué funciona</li>
                <li>Dependencia de la inspiración</li>
                <li>Resultados inconsistentes</li>
              </ul>
            </div>
            <div className="con-sistema">
              <h4>Con sistema EI</h4>
              <ul>
                <li>Contenido con propósito y trazabilidad</li>
                <li>Identidad verbal propia y consistente</li>
                <li>Métricas que guían decisiones</li>
                <li>Producción desde estructura, no humor</li>
                <li>Crecimiento acumulativo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 5 — SOLUCIÓN / EL SISTEMA
          Qué es EI y cómo opera HAYDE
          El método en 3 pasos claros
      ═══════════════════════════════════════════ */}
      <section id="como-funciona">
        <div className="encabezado">
          <h2>El sistema que estructura tu negocio desde adentro</h2>
          <p>
            No trabajamos sobre la superficie. Construimos desde las variables
            que definen cómo tu negocio se ve, se escucha y se posiciona.
          </p>
        </div>

        <div className="pasos">
          <div className="paso">
            <div className="numero">01</div>
            <h3>Diagnóstico estructural</h3>
            <p>
              Analizamos tu negocio a través de 5 variables: base de identidad,
              capacidad estructural, potencial de crecimiento, etapa actual y tendencia.
              Esto determina exactamente qué necesitás y qué no.
            </p>
          </div>

          <div className="paso">
            <div className="numero">02</div>
            <h3>Construcción del sistema</h3>
            <p>
              Diseñamos tu identidad verbal, tu narrativa de posicionamiento,
              tu sistema de contenido y tu arquitectura de comunicación —
              todo conectado, todo trazable, todo tuyo.
            </p>
          </div>

          <div className="paso">
            <div className="numero">03</div>
            <h3>Activación y transferencia</h3>
            <p>
              El sistema se activa en tu operación real.
              No te dejamos con un documento: te dejamos con un sistema
              que tu equipo (o vos solo) puede operar sin depender de nosotros.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 6 — PRODUCTOS
          Fase 1 + Sistema Completo
          Precios, qué incluye, para quién es
      ═══════════════════════════════════════════ */}
      <section id="productos">
        <div className="encabezado">
          <h2>Dos puntos de entrada al sistema</h2>
          <p>Según tu etapa y capacidad actual, empezamos por donde tiene sentido.</p>
        </div>

        <div className="productos-grid">

          <div className="producto-card">
            <div className="etiqueta">Punto de entrada</div>
            <h3>Fase 1 — Sistema de Identidad</h3>
            <div className="precio">$450.000 CLP</div>
            <p className="descripcion">
              Construimos los fundamentos que tu negocio necesita para comunicar
              con claridad y consistencia: posicionamiento, identidad verbal,
              narrativa de marca y arquitectura de mensajes.
            </p>
            <ul className="incluye">
              <li>Diagnóstico estructural completo</li>
              <li>Posicionamiento diferenciado</li>
              <li>Identidad verbal propia</li>
              <li>Narrativa de marca en 3 niveles</li>
              <li>Guía de voz y tono</li>
              <li>Mensajes por canal y audiencia</li>
            </ul>
            <p className="para-quien">
              Para negocios que necesitan claridad antes de producir más contenido.
            </p>
            <a href="#agendar" className="cta-producto">
              Quiero empezar por aquí
            </a>
          </div>

          <div className="producto-card destacado">
            <div className="etiqueta">Recomendado</div>
            <h3>Sistema Completo — Identidad + Contenido</h3>
            <div className="precio">$750.000 CLP</div>
            <p className="descripcion">
              El sistema completo: identidad estructurada + sistema de contenido activo.
              Pasás de tener claridad a tener una máquina de comunicación que opera
              de forma consistente y genera resultados medibles.
            </p>
            <ul className="incluye">
              <li>Todo lo de Fase 1</li>
              <li>Sistema de producción de contenido</li>
              <li>Calendario editorial estratégico</li>
              <li>Biblioteca de formatos por plataforma</li>
              <li>Sistema de activación y distribución</li>
              <li>Métricas y trazabilidad de resultados</li>
              <li>Acompañamiento de implementación</li>
            </ul>
            <p className="para-quien">
              Para negocios listos para escalar su comunicación con sistema propio.
            </p>
            <a href="#agendar" className="cta-producto">
              Quiero el sistema completo
            </a>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 7 — PRUEBA SOCIAL / RESULTADOS
          Testimonios reales o resultados concretos
          Logos de clientes si aplica
      ═══════════════════════════════════════════ */}
      <section id="resultados">
        <div className="encabezado">
          <h2>Negocios que ya operan con sistema</h2>
        </div>

        <div className="testimonios-grid">
          {/* Placeholder — reemplazar con testimonios reales */}
          <div className="testimonio">
            <p className="cita">
              "Antes publicaba sin saber por qué. Ahora cada pieza tiene
              un propósito dentro del sistema y puedo medir qué funciona."
            </p>
            <div className="autor">
              <div className="avatar" />
              <div>
                <strong>Nombre Apellido</strong>
                <span>Tipo de negocio · Ciudad</span>
              </div>
            </div>
          </div>

          <div className="testimonio">
            <p className="cita">
              "El diagnóstico me mostró exactamente dónde estaba el problema.
              No era el contenido — era que no tenía identidad estructurada."
            </p>
            <div className="autor">
              <div className="avatar" />
              <div>
                <strong>Nombre Apellido</strong>
                <span>Tipo de negocio · Ciudad</span>
              </div>
            </div>
          </div>

          <div className="testimonio">
            <p className="cita">
              "Después de 3 meses con el sistema, mis clientes entienden
              lo que hago sin que yo tenga que explicarlo cada vez."
            </p>
            <div className="autor">
              <div className="avatar" />
              <div>
                <strong>Nombre Apellido</strong>
                <span>Tipo de negocio · Ciudad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 8 — FAQ
          Objeciones y preguntas frecuentes
      ═══════════════════════════════════════════ */}
      <section id="faq">
        <h2>Preguntas frecuentes</h2>

        <div className="preguntas">
          <details>
            <summary>¿Cuánto tiempo lleva el proceso?</summary>
            <p>
              Fase 1 toma entre 3 y 4 semanas. El Sistema Completo entre 6 y 8 semanas.
              Los tiempos dependen de la disponibilidad para las sesiones de trabajo.
            </p>
          </details>

          <details>
            <summary>¿Necesito tener un equipo o puedo hacerlo solo?</summary>
            <p>
              El sistema está diseñado para operar con o sin equipo.
              Si trabajás solo, el sistema se adapta a tu capacidad real.
              Si tenés equipo, la transferencia incluye a las personas que operarán el sistema.
            </p>
          </details>

          <details>
            <summary>¿Qué pasa si ya tengo identidad de marca?</summary>
            <p>
              El diagnóstico determina qué tan sólida está esa base.
              Si ya existe y es fuerte, construimos desde ahí.
              Si hay inconsistencias, las resolvemos antes de construir el sistema de contenido.
            </p>
          </details>

          <details>
            <summary>¿El sistema funciona para mi tipo de negocio?</summary>
            <p>
              HAYDE fue diseñado para negocios de servicios, productos digitales
              y emprendimientos que venden conocimiento o expertise.
              El diagnóstico inicial determina si tu negocio es compatible con el sistema.
            </p>
          </details>

          <details>
            <summary>¿Cómo sé si estoy listo para empezar?</summary>
            <p>
              Si tenés un negocio funcionando, clientes reales y la sensación de que
              tu comunicación no refleja lo que realmente hacés — estás listo.
              El diagnóstico gratuito confirma el punto de entrada correcto.
            </p>
          </details>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 9 — CTA FINAL
          Llamada a la acción principal
          Formulario o link a agendar
      ═══════════════════════════════════════════ */}
      <section id="agendar">
        <h2>
          El primer paso es el diagnóstico.<br />
          Es gratuito y dura 30 minutos.
        </h2>
        <p>
          Analizamos tu negocio, identificamos la brecha y te decimos
          exactamente qué necesitás — sin compromiso ni presión de venta.
        </p>

        <div className="formulario-cta">
          {/* Opción A — Link directo a calendario */}
          <a href="https://calendly.com/evolucionainteligente" className="cta-principal" target="_blank" rel="noopener noreferrer">
            Agendar diagnóstico gratuito →
          </a>

          {/* Opción B — Formulario simple (descomentar si se prefiere) */}
          {/*
          <form>
            <input type="text" placeholder="Tu nombre" required />
            <input type="email" placeholder="Tu email" required />
            <input type="text" placeholder="¿A qué se dedica tu negocio?" />
            <button type="submit">Quiero mi diagnóstico gratuito</button>
          </form>
          */}
        </div>

        <p className="garantia">
          Sin spam. Sin presión. Solo una conversación honesta sobre tu negocio.
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          SECCIÓN 10 — FOOTER
          Links legales + redes + contacto
      ═══════════════════════════════════════════ */}
      <footer>
        <div className="footer-logo">
          <strong>Evoluciona Inteligente</strong>
          <span>Sistema de identidad y contenido para negocios</span>
        </div>

        <div className="footer-links">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#productos">Productos</a>
          <a href="#resultados">Resultados</a>
          <a href="#agendar">Diagnóstico gratuito</a>
        </div>

        <div className="footer-redes">
          <a href="https://instagram.com/evolucionainteligente" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="mailto:evolucionainteligent@gmail.com">Email</a>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Evoluciona Inteligente. Todos los derechos reservados.
        </p>
      </footer>

    </main>
  );
}
