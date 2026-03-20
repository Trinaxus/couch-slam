<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
}

try {
    $db = pdo();
    $stmt = $db->prepare(
        'SELECT ar.id, ar.user_id, ar.name, ar.bio, ar.city, ar.genre, ar.avatar_url, ar.photo_url, ar.photo_fit, ar.photo_pos_x, ar.photo_pos_y, ar.instagram, ar.youtube, ar.spotify, ar.website, ar.media_url, ar.created_at, ar.updated_at, '
        . 'a.status AS application__status, '
        . 'e.id AS event__id, e.title AS event__title, e.description AS event__description, e.event_date AS event__event_date, e.stream_url AS event__stream_url, e.youtube_video_id AS event__youtube_video_id, e.is_live AS event__is_live, e.is_accepting_applications AS event__is_accepting_applications, e.archived AS event__archived, e.created_by AS event__created_by, e.created_at AS event__created_at, e.updated_at AS event__updated_at '
        . 'FROM artists ar '
        . 'LEFT JOIN users u ON u.id = ar.user_id '
        . 'LEFT JOIN applications a ON a.artist_id = ar.id '
        . 'LEFT JOIN events e ON e.id = a.event_id '
        . "WHERE (u.id IS NULL OR u.user_type = 'artist' OR u.access_role = 'admin') "
        . 'ORDER BY ar.created_at DESC'
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $artists = [];
    foreach ($rows as $r) {
        $aid = (string) $r['id'];
        if (!isset($artists[$aid])) {
            $artists[$aid] = [
                'id' => $r['id'],
                'user_id' => $r['user_id'],
                'name' => $r['name'],
                'bio' => $r['bio'],
                'city' => $r['city'],
                'genre' => $r['genre'],
                'avatar_url' => $r['avatar_url'] ?? null,
                'photo_url' => $r['photo_url'],
                'photo_fit' => $r['photo_fit'] ?? null,
                'photo_pos_x' => isset($r['photo_pos_x']) ? (int) $r['photo_pos_x'] : null,
                'photo_pos_y' => isset($r['photo_pos_y']) ? (int) $r['photo_pos_y'] : null,
                'instagram' => $r['instagram'],
                'youtube' => $r['youtube'],
                'spotify' => $r['spotify'],
                'website' => $r['website'],
                'media_url' => $r['media_url'],
                'created_at' => $r['created_at'],
                'updated_at' => $r['updated_at'],
                'events' => [],
            ];
        }

        if (!empty($r['event__id'])) {
            $artists[$aid]['events'][] = [
                'event' => [
                    'id' => $r['event__id'],
                    'title' => $r['event__title'],
                    'description' => $r['event__description'],
                    'event_date' => $r['event__event_date'],
                    'stream_url' => $r['event__stream_url'],
                    'youtube_video_id' => $r['event__youtube_video_id'],
                    'is_live' => ((int) $r['event__is_live']) === 1,
                    'is_accepting_applications' => ((int) $r['event__is_accepting_applications']) === 1,
                    'archived' => ((int) $r['event__archived']) === 1,
                    'created_by' => $r['event__created_by'],
                    'created_at' => $r['event__created_at'],
                    'updated_at' => $r['event__updated_at'],
                ],
                'status' => $r['application__status'] ?? null,
            ];
        }
    }

    json_response(['ok' => true, 'artists' => array_values($artists)]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Failed to load artists'], 500);
}
