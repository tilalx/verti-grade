INSERT INTO climbingRoutes (id, name, difficulty, difficulty_sign, location, type, comment, creator, archived, created_at, color, screw_date) 
VALUES 
('3d97d206-7c2e-44a1-86be-77ea29532a15', 'Muster Route', 7, true, 'Bielefeld', 'Route', 'Route endet am umlenker 38', '["Max Mustermann"]', false, '2024-06-30 14:30:25.405743+00', NULL, NULL);

INSERT INTO ratings (id, route_id, rating, difficulty, difficulty_sign, comment, created_at) 
VALUES 
('dbe30289-ee7b-48db-a36b-25c5d4129827', '3d97d206-7c2e-44a1-86be-77ea29532a15', 9, 7, NULL, 'ganz gut', '2024-06-30 14:32:34.359431+00');
