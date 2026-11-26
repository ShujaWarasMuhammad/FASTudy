const fs = require('fs');
const path = require('path');

// 25 Related Rates Practice Questions (Page 5-7)
const rrQuestions = [
  {
    num: 1,
    title: "Sliding Ladder Rate (10-meter ladder)",
    diff: "easy",
    latex: "x^2 + y^2 = 100 \\implies x\\frac{dx}{dt} + y\\frac{dy}{dt} = 0",
    stmt: "A 10-meter ladder rests against a vertical wall. If the bottom of the ladder slides away from the wall at a rate of 1.2 m/s, how fast is the top of the ladder sliding down the wall when the bottom is 6 meters from the wall?",
    exp: "When $x = 6\\text{ m}$, $y = \\sqrt{100 - 36} = 8\\text{ m}$. Differentiating $x^2 + y^2 = 100$ gives $x \\frac{dx}{dt} + y \\frac{dy}{dt} = 0$. Substituting $x = 6, y = 8, \\frac{dx}{dt} = 1.2\\text{ m/s}$: $6(1.2) + 8\\frac{dy}{dt} = 0 \\implies 7.2 + 8\\frac{dy}{dt} = 0 \\implies \\frac{dy}{dt} = -\\frac{7.2}{8} = -0.9\\text{ m/s}$. The top of the ladder is sliding down at $0.9\\text{ m/s}$.",
    tags: ["related-rates", "ladder", "pythagorean", "kinematics"]
  },
  {
    num: 2,
    title: "Conical Tank Draining (Vertex Down)",
    diff: "medium",
    latex: "V = \\frac{\\pi}{12}h^3 \\implies \\frac{dV}{dt} = \\frac{\\pi}{4}h^2 \\frac{dh}{dt}",
    stmt: "Water is leaking from a conical tank (vertex down) at a rate of 3 ft³/min. The tank has a height of 12 ft and a base radius of 6 ft. How fast is the water level falling when the water depth is 4 ft?",
    exp: "By similar triangles, $r/h = 6/12 = 1/2 \\implies r = h/2$. Volume $V = \\frac{1}{3}\\pi (h/2)^2 h = \\frac{\\pi}{12}h^3$. Differentiating: $\\frac{dV}{dt} = \\frac{\\pi}{4}h^2 \\frac{dh}{dt}$. Given $\\frac{dV}{dt} = -3\\text{ ft}^3/\\text{min}$ and $h = 4\\text{ ft}$: $-3 = \\frac{\\pi}{4}(16)\\frac{dh}{dt} = 4\\pi \\frac{dh}{dt} \\implies \\frac{dh}{dt} = -\\frac{3}{4\\pi}\\text{ ft/min} \\approx -0.239\\text{ ft/min}$.",
    tags: ["related-rates", "cone", "volume", "similar-triangles"]
  },
  {
    num: 3,
    title: "Conical Tank Filling Rate",
    diff: "medium",
    latex: "V = \\frac{\\pi}{27}h^3 \\implies \\frac{dV}{dt} = \\frac{\\pi}{9}h^2 \\frac{dh}{dt}",
    stmt: "Water is poured into a conical container at a rate of 10 cm³/sec. The cone points directly down and has a height of 30 cm and a base radius of 10 cm. How fast is the water level rising when the water is 9 cm deep?",
    exp: "Similar triangles: $r/h = 10/30 = 1/3 \\implies r = h/3$. Volume $V = \\frac{1}{3}\\pi (h/3)^2 h = \\frac{\\pi}{27}h^3$. Differentiating: $\\frac{dV}{dt} = \\frac{\\pi}{9}h^2 \\frac{dh}{dt}$. Given $\\frac{dV}{dt} = 10\\text{ cm}^3/\\text{s}$ and $h = 9\\text{ cm}$: $10 = \\frac{\\pi}{9}(81)\\frac{dh}{dt} = 9\\pi \\frac{dh}{dt} \\implies \\frac{dh}{dt} = \\frac{10}{9\\pi}\\text{ cm/s} \\approx 0.354\\text{ cm/s}$.",
    tags: ["related-rates", "conical-container", "filling-rate", "geometry"]
  },
  {
    num: 4,
    title: "Streetlight Shadow Tip & Length Speed",
    diff: "medium",
    latex: "\\frac{s}{6} = \\frac{x + s}{15} \\implies s = \\frac{2}{3}x",
    stmt: "A man 6 feet tall walks away from a streetlight pole 15 feet high at a speed of 5 ft/s. How fast is the tip of his shadow moving, and how fast is the length of his shadow increasing?",
    exp: "Let $x$ be distance from pole and $s$ the shadow length. Similar triangles: $\\frac{s}{6} = \\frac{x + s}{15} \\implies 15s = 6x + 6s \\implies 9s = 6x \\implies s = \\frac{2}{3}x$. Differentiating: $\\frac{ds}{dt} = \\frac{2}{3}\\frac{dx}{dt} = \\frac{2}{3}(5) = \\frac{10}{3}\\text{ ft/s} \\approx 3.33\\text{ ft/s}$ (rate shadow length increases). Position of shadow tip from pole is $y = x + s = \\frac{5}{3}x$. Rate tip moves: $\\frac{dy}{dt} = \\frac{5}{3}\\frac{dx}{dt} = \\frac{5}{3}(5) = \\frac{25}{3}\\text{ ft/s} \\approx 8.33\\text{ ft/s}$.",
    tags: ["related-rates", "shadow", "streetlight", "similar-triangles"]
  },
  {
    num: 5,
    title: "Intersecting Cars Distance Rate",
    diff: "medium",
    latex: "z^2 = x^2 + y^2 \\implies z\\frac{dz}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt}",
    stmt: "Car A is traveling west at 60 mi/h and Car B is traveling north at 80 mi/h toward the same intersection. At a given instant, Car A is 3 miles and Car B is 4 miles away from the intersection. At what rate is the distance between the two cars changing?",
    exp: "Let $x = 3\\text{ mi}$ and $y = 4\\text{ mi}$. Since both cars are moving toward the intersection, $\\frac{dx}{dt} = -60\\text{ mi/h}$ and $\\frac{dy}{dt} = -80\\text{ mi/h}$. Distance between cars $z = \\sqrt{3^2 + 4^2} = 5\\text{ miles}$. Differentiating $z^2 = x^2 + y^2$: $z \\frac{dz}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt} \\implies 5\\frac{dz}{dt} = 3(-60) + 4(-80) = -180 - 320 = -500 \\implies \\frac{dz}{dt} = -100\\text{ mi/h}$. The distance is decreasing at $100\\text{ mi/h}$.",
    tags: ["related-rates", "intersection", "pythagorean", "velocity"]
  },
  {
    num: 6,
    title: "Expanding Circular Oil Slick Area Rate",
    diff: "easy",
    latex: "A = \\pi r^2 \\implies \\frac{dA}{dt} = 2\\pi r \\frac{dr}{dt}",
    stmt: "An oil spill spreads in a circular pattern whose radius increases at a constant rate of 2 ft/min. How fast is the area of the oil slick increasing when the radius reaches 20 ft?",
    exp: "Area $A = \\pi r^2$. Differentiating with respect to $t$: $\\frac{dA}{dt} = 2\\pi r \\frac{dr}{dt}$. Given $r = 20\\text{ ft}$ and $\\frac{dr}{dt} = 2\\text{ ft/min}$: $\\frac{dA}{dt} = 2\\pi(20)(2) = 80\\pi\\text{ ft}^2/\\text{min} \\approx 251.33\\text{ ft}^2/\\text{min}$.",
    tags: ["related-rates", "circle", "area", "oil-spill"]
  },
  {
    num: 7,
    title: "Spherical Balloon Radius Growth Rate",
    diff: "easy",
    latex: "V = \\frac{4}{3}\\pi r^3 \\implies \\frac{dr}{dt} = \\frac{dV/dt}{4\\pi r^2}",
    stmt: "Air is pumped into a spherical balloon at a rate of 500 cm³/min. How fast is the radius of the balloon increasing when the radius is 10 cm?",
    exp: "Volume $V = \\frac{4}{3}\\pi r^3 \\implies \\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}$. Given $\\frac{dV}{dt} = 500\\text{ cm}^3/\\text{min}$ and $r = 10\\text{ cm}$: $500 = 4\\pi (10)^2 \\frac{dr}{dt} = 400\\pi \\frac{dr}{dt} \\implies \\frac{dr}{dt} = \\frac{500}{400\\pi} = \\frac{5}{4\\pi}\\text{ cm/min} \\approx 0.398\\text{ cm/min}$.",
    tags: ["related-rates", "sphere", "balloon", "volume"]
  },
  {
    num: 8,
    title: "Spherical Balloon Surface Area Deflation Rate",
    diff: "medium",
    latex: "S = 4\\pi r^2, \\quad \\frac{dS}{dt} = 8\\pi r \\frac{dr}{dt} = \\frac{2}{r} \\frac{dV}{dt}",
    stmt: "A spherical balloon is deflating at a rate of 30 cm³/sec. How fast is its surface area decreasing when the radius is 5 cm?",
    exp: "Volume: $\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt} \\implies \\frac{dr}{dt} = \\frac{dV/dt}{4\\pi r^2}$. Surface area $S = 4\\pi r^2 \\implies \\frac{dS}{dt} = 8\\pi r \\frac{dr}{dt} = 8\\pi r \\left(\\frac{dV/dt}{4\\pi r^2}\\right) = \\frac{2}{r}\\frac{dV}{dt}$. Given $\\frac{dV}{dt} = -30\\text{ cm}^3/\\text{s}$ and $r = 5\\text{ cm}$: $\\frac{dS}{dt} = \\frac{2}{5}(-30) = -12\\text{ cm}^2/\\text{s}$. The surface area is decreasing at $12\\text{ cm}^2/\\text{s}$.",
    tags: ["related-rates", "sphere", "surface-area", "volume"]
  },
  {
    num: 9,
    title: "Rotating Searchlight Beam Along Straight Shoreline",
    diff: "hard",
    latex: "x = 4\\tan\\theta \\implies \\frac{dx}{dt} = 4\\sec^2\\theta \\frac{d\\theta}{dt}",
    stmt: "A lighthouse is located 4 km off a straight shoreline. Its searchlight rotates at 3 rev/min (6π rad/min). How fast is the light beam moving along the shoreline at a point 3 km down the shore from the closest point?",
    exp: "Shoreline coordinate: $x = 4\\tan\\theta$. When $x = 3\\text{ km}$, the distance from lighthouse is $D = \\sqrt{4^2 + 3^2} = 5\\text{ km}$, so $\\sec\\theta = 5/4$ and $\\sec^2\\theta = 25/16$. Angular velocity $\\frac{d\\theta}{dt} = 6\\pi\\text{ rad/min}$. Rate of beam movement: $\\frac{dx}{dt} = 4\\sec^2\\theta \\frac{d\\theta}{dt} = 4 \\left(\\frac{25}{16}\\right)(6\\pi) = \\frac{75\\pi}{2}\\text{ km/min} \\approx 117.81\\text{ km/min}$.",
    tags: ["related-rates", "lighthouse", "searchlight", "angular-velocity"]
  },
  {
    num: 10,
    title: "Rocket Launch Radar Distance Tracking",
    diff: "medium",
    latex: "D^2 = x^2 + y^2 = 25 + y^2 \\implies D\\frac{dD}{dt} = y\\frac{dy}{dt}",
    stmt: "A rocket is launched vertically and is tracked from a radar station located on the ground 5 miles away from the launch pad. When the rocket is 12 miles high and rising at a speed of 4 mi/s, how fast is the distance between the radar station and the rocket increasing?",
    exp: "Distance from station $D = \\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = 13\\text{ miles}$. Differentiating $D^2 = 25 + y^2$: $2D\\frac{dD}{dt} = 2y\\frac{dy}{dt} \\implies D\\frac{dD}{dt} = y\\frac{dy}{dt}$. With $y = 12\\text{ mi}$, $\\frac{dy}{dt} = 4\\text{ mi/s}$, and $D = 13\\text{ mi}$: $13\\frac{dD}{dt} = 12(4) = 48 \\implies \\frac{dD}{dt} = \\frac{48}{13}\\text{ mi/s} \\approx 3.69\\text{ mi/s}$.",
    tags: ["related-rates", "radar", "rocket", "pythagorean"]
  },
  {
    num: 11,
    title: "Camera Angle of Elevation Rate for Model Rocket",
    diff: "hard",
    latex: "\\tan\\theta = \\frac{y}{30} \\implies \\sec^2\\theta \\frac{d\\theta}{dt} = \\frac{1}{30}\\frac{dy}{dt}",
    stmt: "A camera is positioned 30 meters from the base of a launching platform. A model rocket is shot straight up at 10 m/s. How fast is the camera's angle of elevation changing when the rocket is 40 meters up?",
    exp: "At $y = 40\\text{ m}$, distance to camera is $\\sqrt{30^2 + 40^2} = 50\\text{ m}$. Thus $\\cos\\theta = 30/50 = 3/5 \\implies \\sec\\theta = 5/3 \\implies \\sec^2\\theta = 25/9$. Differentiating $\\tan\\theta = y/30$: $\\sec^2\\theta \\frac{d\\theta}{dt} = \\frac{1}{30}\\frac{dy}{dt} \\implies \\frac{d\\theta}{dt} = \\frac{1}{30\\sec^2\\theta}\\frac{dy}{dt} = \\frac{9}{30(25)}(10) = \\frac{90}{750} = \\frac{3}{25} = 0.12\\text{ rad/s}$.",
    tags: ["related-rates", "angle-of-elevation", "trigonometry", "rocket"]
  },
  {
    num: 12,
    title: "Sand Pile Formation (Base Diameter = 3h)",
    diff: "medium",
    latex: "d = 2r = 3h \\implies r = \\frac{3}{2}h \\implies V = \\frac{3\\pi}{4}h^3",
    stmt: "Dry sand pours from a conveyor belt at 10 m³/min, forming a conical pile whose base diameter is always equal to three times its height. How fast is the height of the pile increasing when the height is 4 meters?",
    exp: "Diameter $2r = 3h \\implies r = \\frac{3}{2}h$. Volume $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\left(\\frac{3}{2}h\\right)^2 h = \\frac{1}{3}\\pi \\left(\\frac{9}{4}h^2\\right) h = \\frac{3\\pi}{4}h^3$. Differentiating: $\\frac{dV}{dt} = \\frac{9\\pi}{4}h^2 \\frac{dh}{dt}$. Given $\\frac{dV}{dt} = 10\\text{ m}^3/\\text{min}$ and $h = 4\\text{ m}$: $10 = \\frac{9\\pi}{4}(16)\\frac{dh}{dt} = 36\\pi \\frac{dh}{dt} \\implies \\frac{dh}{dt} = \\frac{10}{36\\pi} = \\frac{5}{18\\pi}\\text{ m/min} \\approx 0.0884\\text{ m/min}$.",
    tags: ["related-rates", "conveyor-belt", "sand-pile", "geometry"]
  },
  {
    num: 13,
    title: "Engine Crank and Piston Linear Velocity",
    diff: "hard",
    latex: "x(\\theta) = r\\cos\\theta + \\sqrt{L^2 - r^2\\sin^2\\theta}",
    stmt: "In an engine, a connecting rod is 12 inches long, attached to a crank of radius 4 inches rotating at 200 rad/min. Find the linear velocity of the piston when the crank angle is 90°.",
    exp: "Piston displacement $x = 4\\cos\\theta + \\sqrt{144 - 16\\sin^2\\theta}$. Differentiating with respect to time: $\\frac{dx}{dt} = \\left[-4\\sin\\theta - \\frac{32\\sin\\theta\\cos\\theta}{2\\sqrt{144 - 16\\sin^2\\theta}}\\right] \\frac{d\\theta}{dt}$. At $\\theta = 90^\\circ$: $\\sin 90^\\circ = 1$ and $\\cos 90^\\circ = 0$. The second term vanishes because $\\cos 90^\\circ = 0$. Thus $\\frac{dx}{dt} = [-4(1) - 0](200) = -800\\text{ in/min} \\approx -66.67\\text{ ft/min}$.",
    tags: ["related-rates", "engine", "piston", "mechanics"]
  },
  {
    num: 14,
    title: "Triangular Cross-Section Water Trough",
    diff: "medium",
    latex: "V = 10 \\cdot \\frac{1}{2} w h = \\frac{20}{3}h^2",
    stmt: "A water trough is 10 meters long, and its cross-section is an isosceles triangle with a top width of 4 meters and a height of 3 meters. Water is being pumped in at 2 m³/min. How fast is the water level rising when the depth is 1.5 meters?",
    exp: "By similar triangles across the vertical cross-section: $\\frac{w}{h} = \\frac{4}{3} \\implies w = \\frac{4}{3}h$. Cross-sectional area of water $= \\frac{1}{2}wh = \\frac{1}{2}\\left(\\frac{4}{3}h\\right)h = \\frac{2}{3}h^2$. Total water volume $V = \\text{Area} \\times \\text{Length} = \\left(\\frac{2}{3}h^2\\right)(10) = \\frac{20}{3}h^2$. Differentiating: $\\frac{dV}{dt} = \\frac{40}{3}h \\frac{dh}{dt}$. Given $\\frac{dV}{dt} = 2\\text{ m}^3/\\text{min}$ and $h = 1.5\\text{ m}$: $2 = \\frac{40}{3}(1.5)\\frac{dh}{dt} = 20\\frac{dh}{dt} \\implies \\frac{dh}{dt} = \\frac{2}{20} = 0.1\\text{ m/min} = 10\\text{ cm/min}$.",
    tags: ["related-rates", "trough", "isosceles-triangle", "water-reservoir"]
  },
  {
    num: 15,
    title: "Particle Moving on Square Root Curve",
    diff: "easy",
    latex: "y = \\sqrt{x} \\implies \\frac{dy}{dt} = \\frac{1}{2\\sqrt{x}} \\frac{dx}{dt}",
    stmt: "A particle moves along the curve $y = \\sqrt{x}$. As it passes through the point (4, 2), its $y$-coordinate is increasing at a rate of 3 cm/s. How fast is its $x$-coordinate changing at that instant?",
    exp: "Differentiating $y = \\sqrt{x}$ with respect to time $t$: $\\frac{dy}{dt} = \\frac{1}{2\\sqrt{x}} \\frac{dx}{dt} \\implies \\frac{dx}{dt} = 2\\sqrt{x} \\frac{dy}{dt}$. At $(4, 2)$, $x = 4$ and $\\frac{dy}{dt} = 3\\text{ cm/s}$: $\\frac{dx}{dt} = 2\\sqrt{4}(3) = 2(2)(3) = 12\\text{ cm/s}$.",
    tags: ["related-rates", "particle-motion", "curve", "chain-rule"]
  },
  {
    num: 16,
    title: "Rate of Change of Rectangle Diagonal",
    diff: "medium",
    latex: "D^2 = x^2 + y^2 \\implies D\\frac{dD}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt}",
    stmt: "The length of a rectangle is increasing at a rate of 3 cm/s and its width is decreasing at a rate of 2 cm/s. When the length is 10 cm and width is 5 cm, how fast is the length of the diagonal changing?",
    exp: "Diagonal $D = \\sqrt{10^2 + 5^2} = \\sqrt{100 + 25} = \\sqrt{125} = 5\\sqrt{5}\\text{ cm}$. Differentiating $D^2 = x^2 + y^2$: $D\\frac{dD}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt}$. Substituting $x = 10, y = 5, \\frac{dx}{dt} = 3, \\frac{dy}{dt} = -2$: $5\\sqrt{5}\\frac{dD}{dt} = 10(3) + 5(-2) = 30 - 10 = 20 \\implies \\frac{dD}{dt} = \\frac{20}{5\\sqrt{5}} = \\frac{4}{\\sqrt{5}} = \\frac{4\\sqrt{5}}{5} \\approx 1.789\\text{ cm/s}$.",
    tags: ["related-rates", "rectangle", "diagonal", "pythagorean"]
  },
  {
    num: 17,
    title: "Inverted Square Pyramidal Tank Water Rate",
    diff: "hard",
    latex: "V = \\frac{1}{3}s^2 h = \\frac{1}{12}h^3",
    stmt: "Water flows into an inverted square pyramidal tank at 5 m³/min. The base of the pyramid is a square of side 6 meters and the height is 12 meters. How fast is the water level rising when the depth is 4 meters?",
    exp: "Let $s$ be the side of the water square surface at depth $h$. By similar pyramids: $\\frac{s}{h} = \\frac{6}{12} = \\frac{1}{2} \\implies s = \\frac{1}{2}h$. Volume of water $V = \\frac{1}{3}s^2 h = \\frac{1}{3}\\left(\\frac{h}{2}\\right)^2 h = \\frac{1}{12}h^3$. Differentiating: $\\frac{dV}{dt} = \\frac{1}{4}h^2 \\frac{dh}{dt}$. Given $\\frac{dV}{dt} = 5\\text{ m}^3/\\text{min}$ and $h = 4\\text{ m}$: $5 = \\frac{1}{4}(16)\\frac{dh}{dt} = 4\\frac{dh}{dt} \\implies \\frac{dh}{dt} = \\frac{5}{4} = 1.25\\text{ m/min}$.",
    tags: ["related-rates", "pyramid", "volume", "geometry"]
  },
  {
    num: 18,
    title: "Boat Approaching Dock on a Winch",
    diff: "medium",
    latex: "s^2 = x^2 + 5^2 \\implies x\\frac{dx}{dt} = s\\frac{ds}{dt}",
    stmt: "A boat is pulled toward a dock by a rope attached to the bow through a pulley located 5 feet above the bow. If the rope is hauled in at a rate of 2 ft/s, how fast is the boat approaching the dock when the rope is 13 feet long?",
    exp: "Right triangle with horizontal distance $x$, vertical height $5$, and hypotenuse $s = 13\\text{ ft}$. When $s = 13$, $x = \\sqrt{13^2 - 5^2} = \\sqrt{169 - 25} = 12\\text{ ft}$. Differentiating $x^2 + 25 = s^2$: $2x\\frac{dx}{dt} = 2s\\frac{ds}{dt} \\implies x\\frac{dx}{dt} = s\\frac{ds}{dt}$. Given $\\frac{ds}{dt} = -2\\text{ ft/s}$: $12\\frac{dx}{dt} = 13(-2) = -26 \\implies \\frac{dx}{dt} = -\\frac{26}{12} = -\\frac{13}{6}\\text{ ft/s} \\approx -2.17\\text{ ft/s}$. The boat is approaching at $\\frac{13}{6}\\text{ ft/s}$.",
    tags: ["related-rates", "boat", "winch", "pythagorean"]
  },
  {
    num: 19,
    title: "Shadow of a Falling Ball from Light Source",
    diff: "hard",
    latex: "\\frac{s}{20 + s} = \\frac{h}{60} \\implies s = \\frac{20h}{60 - h}",
    stmt: "A ball is dropped from a height of 60 feet directly above a point 20 feet away from a light source on the ground. The height of the ball at time $t$ seconds is $h = 60 - 16t^2$. How fast is the length of the shadow on the ground changing when $t = 1$ second?",
    exp: "By similar triangles, $\\frac{s}{20 + s} = \\frac{h}{60} \\implies 60s = 20h + sh \\implies s(60 - h) = 20h \\implies s = \\frac{20h}{60 - h}$. When $t = 1\\text{ s}$, $h = 60 - 16(1) = 44\\text{ ft}$, and $\\frac{dh}{dt} = -32t = -32\\text{ ft/s}$. Differentiating $s(h)$: $\\frac{ds}{dt} = \\frac{20(60 - h) - 20h(-1)}{(60 - h)^2} \\frac{dh}{dt} = \\frac{1200}{(60 - h)^2} \\frac{dh}{dt}$. Substituting $h = 44$ and $\\frac{dh}{dt} = -32$: $\\frac{ds}{dt} = \\frac{1200}{(16)^2}(-32) = \\frac{1200}{256}(-32) = -\\frac{1200}{8} = -150\\text{ ft/s}$. The shadow length is shrinking at $150\\text{ ft/s}$.",
    tags: ["related-rates", "shadow", "falling-body", "gravity"]
  },
  {
    num: 20,
    title: "Concentric Circular Ripples Area Change",
    diff: "medium",
    latex: "A = \\pi(r_2^2 - r_1^2) = \\pi[(r_1 + 2)^2 - r_1^2] = 4\\pi(r_1 + 1)",
    stmt: "A pebble dropped into a calm pond causes concentric circular ripples. The outer ripple radius increases at 1 ft/s. How fast is the total area enclosed between the first and second ripples ($r_2 - r_1 = 2\\text{ ft}$) changing?",
    exp: "Given $r_2 = r_1 + 2$, with both radii expanding at the same speed $\\frac{dr_2}{dt} = \\frac{dr_1}{dt} = 1\\text{ ft/s}$. Area of the ring $A = \\pi r_2^2 - \\pi r_1^2 = \\pi(r_2^2 - r_1^2)$. Differentiating with respect to time: $\\frac{dA}{dt} = 2\\pi r_2 \\frac{dr_2}{dt} - 2\\pi r_1 \\frac{dr_1}{dt} = 2\\pi(r_2 - r_1)(1) = 2\\pi(2)(1) = 4\\pi\\text{ ft}^2/\\text{s} \\approx 12.57\\text{ ft}^2/\\text{s}$. Remarkably, this rate of area change is completely constant regardless of time!",
    tags: ["related-rates", "ripples", "annulus", "geometry"]
  },
  {
    num: 21,
    title: "Cylinder Volume Rate with Changing Radius and Height",
    diff: "medium",
    latex: "V = \\pi r^2 h \\implies \\frac{dV}{dt} = \\pi\\left(2rh\\frac{dr}{dt} + r^2\\frac{dh}{dt}\\right)",
    stmt: "The radius of a right circular cylinder is increasing at 2 cm/min while its height is decreasing at 3 cm/min. How fast is the volume changing when radius is 5 cm and height is 10 cm?",
    exp: "Differentiating $V = \\pi r^2 h$ using the product rule: $\\frac{dV}{dt} = \\pi\\left(2rh\\frac{dr}{dt} + r^2\\frac{dh}{dt}\\right)$. Given $r = 5\\text{ cm}$, $h = 10\\text{ cm}$, $\\frac{dr}{dt} = 2\\text{ cm/min}$, $\\frac{dh}{dt} = -3\\text{ cm/min}$: $\\frac{dV}{dt} = \\pi [2(5)(10)(2) + 5^2(-3)] = \\pi [200 - 75] = 125\\pi\\text{ cm}^3/\\text{min} \\approx 392.7\\text{ cm}^3/\\text{min}$. The volume is increasing at $125\\pi\\text{ cm}^3/\\text{min}$.",
    tags: ["related-rates", "cylinder", "product-rule", "volume"]
  },
  {
    num: 22,
    title: "Two Ships Sailing Apart After 2 Hours",
    diff: "medium",
    latex: "z^2 = x^2 + y^2 \\implies z\\frac{dz}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt}",
    stmt: "Ship A sails east from a port at 20 knots and Ship B sails south from the same port at 15 knots, starting at the same time. How fast is the distance between them increasing after 2 hours?",
    exp: "After $t = 2\\text{ hours}$: $x = 20(2) = 40\\text{ nm}$, $y = 15(2) = 30\\text{ nm}$. Distance $z = \\sqrt{40^2 + 30^2} = 50\\text{ nautical miles}$. Differentiating $z^2 = x^2 + y^2$: $z\\frac{dz}{dt} = x\\frac{dx}{dt} + y\\frac{dy}{dt} \\implies 50\\frac{dz}{dt} = 40(20) + 30(15) = 800 + 450 = 1250 \\implies \\frac{dz}{dt} = \\frac{1250}{50} = 25\\text{ knots}$. (Since triangles remain similar, speed of separation is constant $\\sqrt{20^2 + 15^2} = 25\\text{ knots}$).",
    tags: ["related-rates", "navigation", "ships", "pythagorean"]
  },
  {
    num: 23,
    title: "Ladder Slumping Midpoint Distance from Corner",
    diff: "hard",
    latex: "d_{\\text{midpoint}} = \\sqrt{\\left(\\frac{x}{2}\\right)^2 + \\left(\\frac{y}{2}\\right)^2} = \\frac{L}{2}",
    stmt: "A beam of length 13 meters slides down between a vertical wall and a horizontal floor. If the top slides down at 0.5 m/s, how fast is the midpoint of the beam moving away from the corner when the base is 5 meters from the wall?",
    exp: "The midpoint coordinates are $(x/2, y/2)$. The distance from the corner $(0, 0)$ to the midpoint is $D = \\sqrt{(x/2)^2 + (y/2)^2} = \\frac{1}{2}\\sqrt{x^2 + y^2} = \\frac{1}{2}(13) = 6.5\\text{ meters}$. Because $x^2 + y^2 = L^2$ is constant, the distance from the origin to the midpoint of the sliding beam is ALWAYS constant ($L/2 = 6.5\\text{ m}$). Therefore, $\\frac{dD}{dt} = 0\\text{ m/s}$. The midpoint travels along a circle of radius 6.5 m centered at the corner, so its distance from the corner does not change at all!",
    tags: ["related-rates", "ladder", "midpoint", "geometric-invariance"]
  },
  {
    num: 24,
    title: "Parabolic Bowl Liquid Level Draining Rate",
    diff: "hard",
    latex: "V = \\int_0^y \\pi x^2 du = \\int_0^y \\pi u du = \\frac{\\pi}{2}y^2",
    stmt: "Liquid drains from a parabolic bowl $y = x^2$ at 2 cm³/sec. How fast is the liquid level dropping when the depth is 4 cm?",
    exp: "The bowl is formed by rotating $y = x^2$ about the $y$-axis. The circular cross-sectional slice at depth $y$ has area $A(y) = \\pi x^2 = \\pi y$. Volume of liquid up to depth $y$ is $V = \\int_0^y \\pi u\\,du = \\frac{\\pi}{2}y^2$. Differentiating with respect to $t$: $\\frac{dV}{dt} = \\pi y \\frac{dy}{dt}$. Given $\\frac{dV}{dt} = -2\\text{ cm}^3/\\text{s}$ and $y = 4\\text{ cm}$: $-2 = \\pi (4) \\frac{dy}{dt} \\implies \\frac{dy}{dt} = -\\frac{2}{4\\pi} = -\\frac{1}{2\\pi}\\text{ cm/s} \\approx -0.159\\text{ cm/s}$. The level drops at $\\frac{1}{2\\pi}\\text{ cm/s}$.",
    tags: ["related-rates", "solid-of-revolution", "paraboloid", "draining-tank"]
  },
  {
    num: 25,
    title: "Airplane Flying Overhead Radar Distance Rate",
    diff: "hard",
    latex: "D^2 = 36 + x^2 \\implies D\\frac{dD}{dt} = x\\frac{dx}{dt}",
    stmt: "An airplane flies horizontally at an altitude of 6 miles and a speed of 500 mi/h directly over a radar station. How fast is the distance between the airplane and the radar station increasing 1 minute after it passes overhead?",
    exp: "Time elapsed: $1\\text{ minute} = 1/60\\text{ hr}$. Horizontal distance traveled: $x = 500 \\times (1/60) = 25/3\\text{ miles} \\approx 8.33\\text{ mi}$. Altitude $y = 6\\text{ miles}$. Distance to radar $D = \\sqrt{6^2 + (25/3)^2} = \\sqrt{36 + 625/9} = \\sqrt{949/9} = \\frac{\\sqrt{949}}{3} \\approx 10.27\\text{ miles}$. Differentiating $D^2 = 36 + x^2$: $D\\frac{dD}{dt} = x\\frac{dx}{dt} \\implies \\frac{dD}{dt} = \\frac{x}{D}\\frac{dx}{dt} = \\frac{25/3}{\\sqrt{949}/3}(500) = \\frac{12500}{\\sqrt{949}} \\approx 405.77\\text{ mi/h}$.",
    tags: ["related-rates", "airplane", "radar-tracking", "pythagorean"]
  }
];

const formattedRR = rrQuestions.map(q => ({
  id: `fast-calc-rr-${String(q.num).padStart(3, '0')}`,
  type: "math_study",
  subjectId: "calculus",
  categoryId: "related-rates",
  subcategoryId: "25-practice",
  title: q.title,
  difficulty: q.diff,
  latexExpression: q.latex,
  statement: q.stmt,
  explanation: q.exp,
  tags: q.tags,
  hints: [
    "Draw a diagram and assign variable names to all quantities changing with time.",
    "Formulate an equation relating the geometric variables.",
    "Differentiate both sides with respect to time t using the chain rule, then substitute the given values."
  ]
}));

const rrFilePath = path.join(__dirname, '../content/calculus/related-rates/25-practice/questions.json');
fs.writeFileSync(rrFilePath, JSON.stringify(formattedRR, null, 2), 'utf8');
console.log('Saved 25 Related Rates questions successfully.');
