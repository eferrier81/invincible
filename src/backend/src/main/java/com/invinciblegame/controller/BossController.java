package com.invinciblegame.controller;

import com.invinciblegame.dto.response.BossResponse;
import com.invinciblegame.service.BossService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bosses")
public class BossController {
    private final BossService bossService;

    public BossController(BossService bossService) {
        this.bossService = bossService;
    }

    @GetMapping
    public List<BossResponse> getBosses() {
        return bossService.findAll();
    }

    @GetMapping("/{id}")
    public BossResponse getBoss(@PathVariable Long id) {
        return bossService.findById(id);
    }
}
