window.EduApps = {
  init() {
    this.initSidebar();
    this.initTheme();
  },

  initSidebar(){
    const sidebarToggle = document.body.querySelector("#sidebarToggle");
    // Toggle the side navigation
    if (sidebarToggle) {
      // Uncomment Below to persist sidebar toggle between refreshes
      // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
      //     document.body.classList.toggle('sb-sidenav-toggled');
      // }
      sidebarToggle.addEventListener("click", (event) => {
        event.preventDefault();
        document.body.classList.toggle("sb-sidenav-toggled");
        localStorage.setItem("sb|sidebar-toggle",
          document.body.classList.contains("sb-sidenav-toggled")
        );
      });
    }
  },

  initTheme(){
    const darkModeSwitch = document.querySelector("#darkModeSwitch");
    // Toggle the dark mode
    if (darkModeSwitch) {
      darkModeSwitch.addEventListener("click", (event) => {
        if (darkModeSwitch.checked) {
            this.setTheme("dark");
        } else {
            this.setTheme("light");
        }
      });
    }

    // Set the initial theme based on user preference or system settings
    if(localStorage.getItem("theme") === null){
        if (window.matchMedia) {
            if(window.matchMedia('(prefers-color-scheme: dark)').matches){
                this.setTheme("dark");
            } else {
                darkModeSwitch.checked = false;
                this.setTheme("light");
            }
        } else {
            //default
            this.setTheme("dark");
        }
    }else{
        const savedTheme = localStorage.getItem("theme");
        if(savedTheme === "light"){
            darkModeSwitch.checked = false;
        }
        this.setTheme(savedTheme);
    }
  },

  // Set the theme and save the preference in localStorage
  setTheme(theme){
    document.body.dataset.bsTheme = theme;
    localStorage.setItem("theme", theme); 
  },

  /*
  const liveToastBtn = document.querySelector('#liveToastBtn');
  const message = "Dit is een bericht voor de toast";
  if(liveToastBtn){
    liveToastBtn.addEventListener('click', e => {
      const newToast = renderNewToast(message);
      const toatsContainer = document.querySelector('#toatsContainer');
      toatsContainer.insertAdjacentHTML('beforeend', newToast);
      const bsToast = new bootstrap.Toast(toatsContainer.lastChild);
      bsToast.show();
    })		
  }
  */
  // Render a new toast message with the specified type (info, success, warning, alert)
  renderNewToast(msg, type = info){
    let bgColor = "bg-body"; 
    switch(type) {
      case "info":
        bgColor = "bg-body"; 
        break;
      case "success":
        bgColor = "text-bg-success"; 
        break;
      case "warning":
        bgColor = "text-bg-warning"; 
        break;
      case "alert":
        bgColor = "text-bg-danger"; 
        break;
      default:
      // code block
    }
    // Create the HTML for the new toast message
    const newToast = `
      <div class="toast mb-2 ${bgColor}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <!--<img src="..." class="rounded me-2" alt="...">-->
          <strong class="me-auto">EduApps | Aspirant</strong>
          <small class="text-muted">just now</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${msg}</div>
      </div>`;
    // Insert the new toast message into the toasts container and show it
    const toatsContainer = document.querySelector('#toatsContainer');
    toatsContainer.insertAdjacentHTML('beforeend', newToast);
    const bsToast = new bootstrap.Toast(toatsContainer.lastChild);
    bsToast.show();
  },

  async fetchData(url, method = "GET", data = null) {
    method = method.toUpperCase();

    const options = {
      method,
      credentials: "same-origin",            // cookie meesturen (standaard bij same-origin, maar expliciet is duidelijker)
      headers: {
        "Accept": "application/json",
      },
    };

    if (data !== null) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }

    // CSRF-token enkel bij wijzigende requests
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      if (token) {
        options.headers["X-CSRF-Token"] = token;
      }
    }

    const result = await fetch(url, options);

    if (result.status === 401) {
      // Sessie verlopen: naar de loginpagina, met terugkeer naar de huidige pagina
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      if (loginModal){
        loginModal.show();
      }else{
        const returnTo = encodeURIComponent(location.pathname + location.search);
        window.location.href = `/eduapps/core/public/login/?return=${returnTo}`;
      }
      loginModal.show();
      throw new Error("Session expired");
    }

    if (!result.ok) {
      // Probeer de foutmelding van de API te lezen ({"error": "..."})
      let message = `HTTP error! status: ${result.status}`;
      try {
        const body = await result.json();
        if (body.error) message = body.error;
      } catch (_) { /* geen JSON in de response */ }

      const error = new Error(message);
      error.status = result.status;
      throw error;
    }

    // 204 No Content (bv. na een DELETE) heeft geen body
    if (result.status === 204) return null;

    return result.json();
  }
};
